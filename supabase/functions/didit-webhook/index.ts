import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-v2',
};

interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'In Review';
  decision: {
    id_verification?: {
      status: string;
      confidence: number;
    };
    face_match?: {
      status: string;
      confidence: number;
    };
  };
  vendor_data?: string;
  timestamp?: string;
}

// Helper function to verify HMAC signature
async function verifySignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get webhook secret
    const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');
    if (!DIDIT_WEBHOOK_SECRET) {
      console.error('Missing DIDIT_WEBHOOK_SECRET');
      return new Response('Configuration error', { status: 500 });
    }

    // Get request body as text for signature verification
    const bodyText = await req.text();
    const signature = req.headers.get('x-signature-v2');

    // Verify signature
    const isValid = await verifySignature(bodyText, signature, DIDIT_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse payload
    const payload: DiditWebhookPayload = JSON.parse(bodyText);
    console.log('Received webhook for session:', payload.session_id);
    console.log('Status:', payload.status);

    // Find verification by didit_session_id
    const { data: verification, error: fetchError } = await supabaseClient
      .from('identity_verifications')
      .select('*')
      .eq('didit_session_id', payload.session_id)
      .single();

    if (fetchError || !verification) {
      console.error('Verification not found for session:', payload.session_id);
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map didit status to app status
    let newStatus: 'verified' | 'rejected' | 'pending' = 'pending';
    let verifiedAt: string | null = null;
    let rejectionReason: string | null = null;

    if (payload.status === 'Approved') {
      newStatus = 'verified';
      verifiedAt = new Date().toISOString();
    } else if (payload.status === 'Declined') {
      newStatus = 'rejected';

      // Extract rejection reason from decision
      const reasons: string[] = [];
      if (payload.decision?.id_verification?.status !== 'Approved') {
        reasons.push('Document d\'identité invalide ou non reconnu');
      }
      if (payload.decision?.face_match?.status !== 'Approved') {
        reasons.push('La photo ne correspond pas au document');
      }
      rejectionReason = reasons.length > 0 ? reasons.join('. ') : 'Vérification refusée par didit';
    }

    // Update verification record
    const updateData: any = {
      status: newStatus,
      didit_decision_data: payload.decision,
      didit_completed_at: new Date().toISOString(),
    };

    if (verifiedAt) {
      updateData.verified_at = verifiedAt;
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabaseClient
      .from('identity_verifications')
      .update(updateData)
      .eq('id', verification.id);

    if (updateError) {
      console.error('Failed to update verification:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update verification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verification ${verification.id} updated to status: ${newStatus}`);

    // If verification approved, delete documents from storage (GDPR compliance)
    if (newStatus === 'verified') {
      console.log('Deleting documents from storage...');
      const filesToDelete: string[] = [];

      if (verification.id_document_front_url) {
        filesToDelete.push(verification.id_document_front_url);
      }
      if (verification.id_document_back_url) {
        filesToDelete.push(verification.id_document_back_url);
      }
      if (verification.selfie_url) {
        filesToDelete.push(verification.selfie_url);
      }

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabaseClient.storage
          .from('identity-verifications')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Failed to delete documents:', deleteError);
          // Don't fail the webhook if deletion fails - log it for manual cleanup
        } else {
          console.log('Documents deleted successfully');
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in didit-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

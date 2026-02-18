import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// iDenfy sends HMAC-SHA256 signature in x-idenfy-signature header
async function verifyIdenfySignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expected = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expected === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const bodyText = await req.text();
    const signature = req.headers.get('x-idenfy-signature');
    const IDENFY_WEBHOOK_SECRET = Deno.env.get('IDENFY_WEBHOOK_SECRET');

    // Verify signature if secret is configured
    if (IDENFY_WEBHOOK_SECRET) {
      const isValid = await verifyIdenfySignature(bodyText, signature, IDENFY_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid iDenfy webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const payload = JSON.parse(bodyText);
    console.log('iDenfy webhook received, clientId:', payload.clientId, 'scanRef:', payload.scanRef);
    console.log('Status:', JSON.stringify(payload.status));

    const clientId = payload.clientId;
    const scanRef = payload.scanRef;

    if (!clientId && !scanRef) {
      return new Response('Missing clientId or scanRef', { status: 400 });
    }

    // Find verification by clientId (=verification_id) or scanRef
    let verification = null;

    if (clientId) {
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('id', clientId)
        .single();
      verification = data;
    }

    if (!verification && scanRef) {
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('didit_session_id', scanRef)
        .single();
      verification = data;
    }

    if (!verification) {
      console.error('Verification not found for clientId:', clientId, 'scanRef:', scanRef);
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map iDenfy overall status to our status
    // iDenfy status.overall: APPROVED | DENIED | SUSPECTED | REVIEWING | EXPIRED
    const overallStatus: string = payload.status?.overall ?? payload.status ?? 'REVIEWING';

    let newStatus: 'verified' | 'rejected' | 'pending' = 'pending';
    let verifiedAt: string | null = null;
    let rejectionReason: string | null = null;

    if (overallStatus === 'APPROVED') {
      newStatus = 'verified';
      verifiedAt = new Date().toISOString();
    } else if (overallStatus === 'DENIED' || overallStatus === 'SUSPECTED' || overallStatus === 'EXPIRED') {
      newStatus = 'rejected';
      const reasons: string[] = [];
      if (payload.status?.autoDocument && payload.status.autoDocument !== 'DOC_VALIDATED') {
        reasons.push('Document d\'identité invalide ou non reconnu');
      }
      if (payload.status?.autoFace && payload.status.autoFace !== 'FACE_MATCH') {
        reasons.push('La photo ne correspond pas au document');
      }
      if (overallStatus === 'SUSPECTED') {
        reasons.push('Suspicion de fraude détectée');
      }
      if (overallStatus === 'EXPIRED') {
        reasons.push('La session de vérification a expiré');
      }
      rejectionReason = reasons.length > 0
        ? reasons.join('. ')
        : 'Vérification refusée par iDenfy';
    }
    // REVIEWING → stays 'pending'

    const updateData: any = {
      status: newStatus,
      didit_decision_data: payload.status,
      didit_completed_at: new Date().toISOString(),
    };

    if (verifiedAt) updateData.verified_at = verifiedAt;
    if (rejectionReason) updateData.rejection_reason = rejectionReason;

    const { error: updateError } = await supabase
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

    console.log(`Verification ${verification.id} updated to: ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('idenfy-webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

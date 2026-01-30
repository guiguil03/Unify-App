import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiditSessionRequest {
  verification_id: string;
}

interface DiditSessionResponse {
  session_id: string;
  session_token: string;
  status: string;
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

    // Get request body
    const { verification_id }: DiditSessionRequest = await req.json();

    if (!verification_id) {
      return new Response(
        JSON.stringify({ error: 'verification_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get didit configuration from environment
    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
    const DIDIT_WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID');

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      const missingSecrets = [];
      if (!DIDIT_API_KEY) missingSecrets.push('DIDIT_API_KEY');
      if (!DIDIT_WORKFLOW_ID) missingSecrets.push('DIDIT_WORKFLOW_ID');

      console.error('Missing didit configuration:', missingSecrets.join(', '));
      return new Response(
        JSON.stringify({
          error: 'Configuration didit manquante sur le serveur',
          details: `Secrets manquants: ${missingSecrets.join(', ')}. Consultez DIDIT_SETUP.md pour la configuration.`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch verification from database
    const { data: verification, error: fetchError } = await supabaseClient
      .from('identity_verifications')
      .select('*')
      .eq('id', verification_id)
      .single();

    if (fetchError || !verification) {
      console.error('Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if required documents exist
    if (!verification.id_document_front_url) {
      return new Response(
        JSON.stringify({ error: 'ID document front is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!verification.selfie_url) {
      return new Response(
        JSON.stringify({ error: 'Selfie is required for face matching' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to download and convert image to base64
    async function getImageBase64(filePath: string): Promise<string> {
      // Create signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('identity-verifications')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError || !signedUrlData) {
        throw new Error(`Failed to create signed URL for ${filePath}`);
      }

      // Download image
      const imageResponse = await fetch(signedUrlData.signedUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from ${filePath}`);
      }

      // Convert to base64
      const arrayBuffer = await imageResponse.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert bytes to base64
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    // Download and convert images to base64
    console.log('Downloading images...');
    const frontImageBase64 = await getImageBase64(verification.id_document_front_url);
    const selfieBase64 = await getImageBase64(verification.selfie_url);

    let backImageBase64: string | undefined;
    if (verification.id_document_back_url) {
      backImageBase64 = await getImageBase64(verification.id_document_back_url);
    }

    // Prepare didit API request payload
    const diditPayload: any = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: verification.user_id,
      documents: {
        front: frontImageBase64,
      },
      selfie: selfieBase64,
    };

    if (backImageBase64) {
      diditPayload.documents.back = backImageBase64;
    }

    // Call didit API to create session
    console.log('Calling didit API...');
    const diditResponse = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIDIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diditPayload),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error('didit API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create didit session', details: errorText }),
        { status: diditResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const diditData: DiditSessionResponse = await diditResponse.json();
    console.log('didit session created:', diditData.session_id);

    // Update verification record with didit session ID
    const { error: updateError } = await supabaseClient
      .from('identity_verifications')
      .update({
        didit_session_id: diditData.session_id,
        didit_submitted_at: new Date().toISOString(),
      })
      .eq('id', verification_id);

    if (updateError) {
      console.error('Failed to update verification:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update verification record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: diditData.session_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in didit-create-session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

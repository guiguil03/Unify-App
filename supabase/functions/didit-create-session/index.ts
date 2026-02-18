import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[didit-create-session] Request received');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { verification_id } = body;
    console.log('[didit-create-session] verification_id:', verification_id);

    if (!verification_id) {
      return new Response(
        JSON.stringify({ error: 'verification_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
    const DIDIT_WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID');

    console.log('[didit-create-session] DIDIT_API_KEY:', DIDIT_API_KEY ? `✓ présent (${DIDIT_API_KEY.substring(0, 8)}...)` : '✗ MANQUANT');
    console.log('[didit-create-session] DIDIT_WORKFLOW_ID:', DIDIT_WORKFLOW_ID ? `✓ présent (${DIDIT_WORKFLOW_ID.substring(0, 8)}...)` : '✗ MANQUANT');

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      const missing = [!DIDIT_API_KEY && 'DIDIT_API_KEY', !DIDIT_WORKFLOW_ID && 'DIDIT_WORKFLOW_ID'].filter(Boolean).join(', ');
      return new Response(
        JSON.stringify({ error: `Secrets manquants: ${missing}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la vérification
    const { data: verification, error: fetchError } = await supabaseClient
      .from('identity_verifications')
      .select('*')
      .eq('id', verification_id)
      .single();

    if (fetchError || !verification) {
      console.error('[didit-create-session] Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[didit-create-session] front:', verification.id_document_front_url ? '✓' : '✗');
    console.log('[didit-create-session] back:', verification.id_document_back_url ? '✓' : 'absent');
    console.log('[didit-create-session] selfie:', verification.selfie_url ? '✓' : '✗');

    if (!verification.id_document_front_url) {
      return new Response(JSON.stringify({ error: 'ID document front is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!verification.selfie_url) {
      return new Response(JSON.stringify({ error: 'Selfie is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Convertir image en base64
    async function getImageBase64(filePath: string): Promise<string> {
      const { data: signedUrlData, error } = await supabaseClient.storage
        .from('identity-verifications')
        .createSignedUrl(filePath, 3600);

      if (error || !signedUrlData) throw new Error(`Signed URL error: ${error?.message}`);

      const imageResponse = await fetch(signedUrlData.signedUrl);
      if (!imageResponse.ok) throw new Error(`Download failed: ${imageResponse.status}`);

      const arrayBuffer = await imageResponse.arrayBuffer();
      console.log('[didit-create-session] Image:', filePath.split('/').pop(), '→', Math.round(arrayBuffer.byteLength / 1024), 'KB');

      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }

    console.log('[didit-create-session] Converting images...');
    const frontBase64 = await getImageBase64(verification.id_document_front_url);
    const selfieBase64 = await getImageBase64(verification.selfie_url);
    let backBase64: string | undefined;
    if (verification.id_document_back_url) {
      backBase64 = await getImageBase64(verification.id_document_back_url);
    }

    const diditPayload = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: verification_id,
      documents: {
        front: frontBase64,
        ...(backBase64 ? { back: backBase64 } : {}),
      },
      selfie: selfieBase64,
    };

    console.log('[didit-create-session] Calling didit API — workflow_id:', DIDIT_WORKFLOW_ID);
    console.log('[didit-create-session] URL: https://verification.didit.me/v3/session/');

    const diditResponse = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'x-api-key': DIDIT_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(diditPayload),
    });

    const responseText = await diditResponse.text();
    console.log('[didit-create-session] didit status:', diditResponse.status);
    console.log('[didit-create-session] didit response:', responseText);

    if (!diditResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Échec didit', details: responseText }),
        { status: diditResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const diditData = JSON.parse(responseText);
    console.log('[didit-create-session] session_id:', diditData.session_id);

    await supabaseClient
      .from('identity_verifications')
      .update({
        didit_session_id: diditData.session_id,
        didit_submitted_at: new Date().toISOString(),
      })
      .eq('id', verification_id);

    console.log('[didit-create-session] ✅ Done');
    return new Response(
      JSON.stringify({ success: true, session_id: diditData.session_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[didit-create-session] ❌ Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

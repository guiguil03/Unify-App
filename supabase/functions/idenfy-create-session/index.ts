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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { verification_id } = await req.json();
    if (!verification_id) {
      return new Response(
        JSON.stringify({ error: 'verification_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const IDENFY_API_KEY = Deno.env.get('IDENFY_API_KEY');
    const IDENFY_API_SECRET = Deno.env.get('IDENFY_API_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!IDENFY_API_KEY || !IDENFY_API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Secrets IDENFY_API_KEY / IDENFY_API_SECRET manquants dans Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la vérification et les infos utilisateur
    const { data: verification, error: fetchError } = await supabase
      .from('identity_verifications')
      .select('*, users(name)')
      .eq('id', verification_id)
      .single();

    if (fetchError || !verification) {
      return new Response(
        JSON.stringify({ error: 'Vérification introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire prénom / nom depuis le nom complet (ou fallback)
    const fullName: string = (verification.users as any)?.name ?? 'User';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    // Authentification Basic Auth iDenfy
    const credentials = btoa(`${IDENFY_API_KEY}:${IDENFY_API_SECRET}`);
    const webhookUrl = `${SUPABASE_URL}/functions/v1/idenfy-webhook`;

    // Appel API iDenfy pour générer le token
    const idenfyResponse = await fetch('https://ivs.idenfy.com/api/v2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: verification_id,
        firstName,
        lastName,
        tokenType: 'IDENTIFICATION',
        locale: 'fr',
        callbackUrl: webhookUrl,
        expiryTime: 3600,
      }),
    });

    if (!idenfyResponse.ok) {
      const err = await idenfyResponse.text();
      console.error('iDenfy API error:', idenfyResponse.status, err);
      return new Response(
        JSON.stringify({ error: 'Impossible de créer la session iDenfy', details: err }),
        { status: idenfyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { authToken, scanRef } = await idenfyResponse.json();
    console.log('iDenfy session created, scanRef:', scanRef);

    // Sauvegarder le scanRef dans la DB (réutilisation du champ didit_session_id)
    await supabase
      .from('identity_verifications')
      .update({
        didit_session_id: scanRef,
        didit_submitted_at: new Date().toISOString(),
        status: 'pending',
      })
      .eq('id', verification_id);

    const sessionUrl = `https://ivs.idenfy.com/api/v2/redirect?authToken=${authToken}`;

    return new Response(
      JSON.stringify({ success: true, sessionUrl, scanRef }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('idenfy-create-session error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

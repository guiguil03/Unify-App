import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FROM_EMAIL = 'Unify <noreply@unify-run.fr>';
const REDIRECT_TO = 'com.unify.team://auth/callback';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildConfirmEmailHtml(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-style: italic;">UNIFY</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Votre plateforme de running</p>
  </div>
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #7D80F4; margin-top: 0;">Confirmez votre compte</h2>
    <p>Bonjour,</p>
    <p>Merci de vous être inscrit sur <strong>Unify</strong> ! Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="${confirmUrl}"
         style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); color: white; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
        Confirmer mon compte
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <span style="color: #7D80F4; word-break: break-all;">${confirmUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      Si vous n'avez pas créé de compte, ignorez cet email.<br>
      © ${new Date().getFullYear()} Unify. Tous droits réservés.
    </p>
  </div>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'name, email et password sont requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client — pas de rate limit
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Créer l'utilisateur sans envoyer l'email Supabase (email_confirm: false = non confirmé)
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: false, // l'user doit confirmer via notre email Resend
    });

    if (createError) {
      // Si l'user existe déjà
      if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
        return new Response(JSON.stringify({ error: 'Cette adresse email est déjà utilisée.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw createError;
    }

    const userId = createData.user.id;

    // 2. Créer le profil dans la table users
    await admin.from('users').insert({
      auth_user_id: userId,
      email,
      name,
      created_at: new Date().toISOString(),
    });

    // 3. Générer le lien de confirmation (admin API, pas de rate limit)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: REDIRECT_TO },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Erreur génération lien:', linkError);
      // L'user est créé mais on n'a pas pu envoyer l'email — on continue sans bloquer
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const confirmUrl = linkData.properties.action_link;

    // 4. Envoyer via Resend
    await sendViaResend(
      email,
      'Confirmez votre compte Unify',
      buildConfirmEmailHtml(confirmUrl),
    );

    return new Response(JSON.stringify({ success: true, emailSent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erreur register-user:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

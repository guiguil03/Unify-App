import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '';
const FROM_EMAIL = 'Unify <noreply@unify-run.fr>';

// Types du payload envoyé par Supabase Auth Hook "Send Email"
interface AuthHookPayload {
  user: {
    id: string;
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'invite' | 'email_change' | 'reauthentication';
    site_url: string;
  };
}

function buildConfirmationUrl(tokenHash: string, redirectTo: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: 'signup',
    next: redirectTo || 'com.unify.team://auth/callback',
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
}

function buildSignupEmailHtml(confirmUrl: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre compte Unify</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-style: italic;">UNIFY</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Votre plateforme de running</p>
  </div>
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #7D80F4; margin-top: 0;">Confirmez votre compte</h2>
    <p>Bonjour,</p>
    <p>Merci de vous être inscrit sur <strong>Unify</strong> ! Pour activer votre compte et commencer à courir avec votre communauté, cliquez sur le bouton ci-dessous :</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="${confirmUrl}" style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); color: white; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
        Confirmer mon compte
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">
      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
    </p>
    <p style="color: #7D80F4; font-size: 12px; word-break: break-all;">
      ${confirmUrl}
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      Si vous n'avez pas créé de compte sur Unify, ignorez cet email.<br>
      © ${new Date().getFullYear()} Unify. Tous droits réservés.
    </p>
  </div>
</body>
</html>`;
}

function buildRecoveryEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - Unify</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-style: italic;">UNIFY</h1>
  </div>
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #7D80F4; margin-top: 0;">Réinitialisation de mot de passe</h2>
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #7D80F4 0%, #B29EEB 100%); color: white; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">Ce lien expire dans 1 heure.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br>
      © ${new Date().getFullYear()} Unify. Tous droits réservés.
    </p>
  </div>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configurée');
  }

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

  console.log('Email envoyé via Resend à', to);
}

serve(async (req) => {
  // Supabase Auth Hook envoie un POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Vérification du token d'autorisation envoyé par Supabase
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!HOOK_SECRET || token !== HOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: AuthHookPayload = await req.json();
    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to } = email_data;

    console.log(`Auth hook appelé: type=${email_action_type}, email=${user.email}`);

    if (email_action_type === 'signup') {
      const confirmUrl = buildConfirmationUrl(token_hash, redirect_to);
      await sendViaResend(
        user.email,
        'Confirmez votre compte Unify',
        buildSignupEmailHtml(confirmUrl, user.email),
      );
    } else if (email_action_type === 'recovery') {
      const resetUrl = buildConfirmationUrl(token_hash, redirect_to).replace('type=signup', 'type=recovery');
      await sendViaResend(
        user.email,
        'Réinitialisation de votre mot de passe - Unify',
        buildRecoveryEmailHtml(resetUrl),
      );
    } else {
      console.log(`Type d'email non géré: ${email_action_type}, Supabase enverra l'email par défaut`);
    }

    // Le hook doit retourner un objet vide en cas de succès
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erreur auth hook:', error);
    // Retourner une erreur pour que Supabase sache que l'envoi a échoué
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

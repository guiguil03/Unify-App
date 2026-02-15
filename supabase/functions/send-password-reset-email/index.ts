import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface ResendEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Générer un code OTP de 6 chiffres
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailWithResend(email: string, code: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY n\'est pas configurée');
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de réinitialisation de mot de passe</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Unify</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Code de réinitialisation</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code suivant dans l'application :</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #fff; border: 3px solid #667eea; border-radius: 10px; padding: 20px; display: inline-block;">
            <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Ce code expire dans 10 minutes.</strong>
        </p>
        <p style="color: #666; font-size: 14px;">
          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Unify. Tous droits réservés.
        </p>
      </div>
    </body>
    </html>
  `;

  // Email d'expéditeur (peut être configuré via variable d'environnement)
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Unify <noreply@unify.app>';

  const emailData: ResendEmailRequest = {
    from: 'Unify <noreply@unify-run.fr>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Unify',
    html: emailHtml,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erreur Resend:', error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log('Email envoyé avec succès:', result);
}

serve(async (req) => {
  try {
    // Vérifier que la méthode est POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase avec la service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Vérifier que l'utilisateur existe en essayant de générer un lien
    // Si l'utilisateur n'existe pas, on retourne un succès pour des raisons de sécurité
    const { error: userCheckError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (userCheckError) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', userCheckError);
      // Pour des raisons de sécurité, on retourne un succès même si l'utilisateur n'existe pas
      return new Response(
        JSON.stringify({ success: true, message: 'Si cet email existe, un code de réinitialisation a été envoyé.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Générer un code OTP de 6 chiffres
    const code = generateOTP();
    
    // Stocker le code dans la base de données avec une expiration de 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Marquer les anciens codes comme utilisés pour cet email
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Insérer le nouveau code
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        email: email,
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Erreur lors de l\'insertion du code:', insertError);
      // Pour des raisons de sécurité, on retourne un succès même en cas d'erreur
      return new Response(
        JSON.stringify({ success: true, message: 'Si cet email existe, un code de réinitialisation a été envoyé.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Envoyer l'email avec le code
    await sendEmailWithResend(email, code);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de réinitialisation envoyé avec succès' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    // Pour des raisons de sécurité, on retourne un succès même en cas d'erreur
      return new Response(
        JSON.stringify({ success: true, message: 'Si cet email existe, un code de réinitialisation a été envoyé.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
  }
});


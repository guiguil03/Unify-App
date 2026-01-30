import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface ResendEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

async function sendEmailWithResend(email: string, resetToken: string, resetUrl: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY n\'est pas configurée');
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Unify</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p>Ou copiez-collez ce lien dans votre navigateur :</p>
        <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
          ${resetUrl}
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Ce lien expire dans 1 heure.</strong>
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
    from: fromEmail,
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier que l'utilisateur existe
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError || !userData?.user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return new Response(
        JSON.stringify({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // URL de redirection pour l'application (deep link)
    const appUrl = Deno.env.get('APP_URL') || 'unify://reset-password';
    const redirectTo = `${appUrl}?email=${encodeURIComponent(email)}`;

    // Générer un token de réinitialisation avec Supabase
    // On utilise generateLink pour créer un lien de réinitialisation
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (linkError || !linkData) {
      console.error('Erreur lors de la génération du lien:', linkError);
      // Pour des raisons de sécurité, on retourne un succès même en cas d'erreur
      return new Response(
        JSON.stringify({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Le lien généré par Supabase contient le token et redirigera vers notre app
    // Le format est: https://...supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=...
    const resetUrl = linkData.properties.action_link;
    
    // Extraire le token du lien pour l'inclure dans l'email (optionnel, pour référence)
    let resetToken = '';
    try {
      const urlObj = new URL(resetUrl);
      resetToken = urlObj.searchParams.get('token') || 
                   urlObj.searchParams.get('token_hash') || '';
      
      // Si le token n'est pas dans les query params, essayer de l'extraire du hash
      if (!resetToken) {
        const tokenMatch = resetUrl.match(/[#&?]token=([^&]+)/);
        resetToken = tokenMatch ? tokenMatch[1] : '';
      }
    } catch (e) {
      console.error('Erreur lors de l\'extraction du token:', e);
    }

    // Utiliser le lien Supabase complet qui redirigera vers notre app
    const finalResetUrl = resetUrl;

    // Envoyer l'email avec Resend
    await sendEmailWithResend(email, resetToken, finalResetUrl);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de réinitialisation envoyé avec succès' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    // Pour des raisons de sécurité, on retourne un succès même en cas d'erreur
    return new Response(
      JSON.stringify({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


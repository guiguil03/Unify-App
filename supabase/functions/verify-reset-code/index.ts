import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    // Vérifier que la méthode est POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, code, newPassword } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email et code requis' }),
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

    // Vérifier le code dans la base de données
    const { data: codeData, error: codeError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Code invalide ou expiré. Veuillez demander un nouveau code.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si newPassword est fourni, réinitialiser le mot de passe
    if (newPassword) {
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer l'utilisateur par email en utilisant listUsers avec un filtre
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      
      if (userError) {
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération de l\'utilisateur' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la réinitialisation du mot de passe' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Marquer le code comme utilisé
      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Mot de passe réinitialisé avec succès' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si pas de newPassword, juste vérifier le code
    return new Response(
      JSON.stringify({ success: true, message: 'Code valide' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


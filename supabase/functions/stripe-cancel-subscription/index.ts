import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    const { subscriptionId, userId } = await req.json();

    if (!subscriptionId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier que l'abonnement appartient à l'utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user || user.stripe_subscription_id !== subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Abonnement non autorisé' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Annuler l'abonnement à la fin de la période
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Mettre à jour dans Supabase
    await supabase
      .from('users')
      .update({
        subscription_cancel_at_period_end: true,
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


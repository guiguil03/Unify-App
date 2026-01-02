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
    const { priceId, userId, successUrl, cancelUrl } = await req.json();

    // Si priceId n'est pas fourni, utiliser celui de l'environnement
    const finalPriceId = priceId || Deno.env.get('STRIPE_PRICE_ID');

    if (!finalPriceId || !userId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants (priceId, userId, successUrl, cancelUrl requis)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase avec la service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer l'utilisateur depuis Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let customerId = user.stripe_customer_id;

    // Créer un client Stripe si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: userId },
        email: user.email || undefined,
      });
      customerId = customer.id;

      // Sauvegarder le customer ID dans Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: userId },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
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


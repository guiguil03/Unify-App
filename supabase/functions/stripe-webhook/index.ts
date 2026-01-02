import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  // La vérification JWT est désactivée via config.toml (verify_jwt = false)
  // La sécurité est assurée par la vérification de signature Stripe ci-dessous

  console.log('Webhook reçu, vérification de la signature...');

  // Vérifier que la requête vient bien de Stripe (via le header user-agent)
  const userAgent = req.headers.get('user-agent') || '';
  console.log('User-Agent:', userAgent);
  
  if (!userAgent.includes('Stripe')) {
    console.warn('User-Agent non-Stripe détecté:', userAgent);
    // On continue quand même car la signature Stripe sera vérifiée
  }

  const signature = req.headers.get('stripe-signature');
  console.log('Signature présente:', !!signature);

  if (!signature) {
    console.error('Signature Stripe manquante');
    return new Response(
      JSON.stringify({ error: 'Signature manquante' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Lire le body comme texte brut (important pour la vérification de signature)
  const body = await req.text();
  console.log('Body length:', body.length);
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET non configuré');
    return new Response(
      JSON.stringify({ error: 'Configuration webhook manquante. Vérifiez que STRIPE_WEBHOOK_SECRET est défini dans les secrets Supabase.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log('Webhook secret présent:', !!webhookSecret);

  let event: Stripe.Event;

  try {
    // Le secret Stripe doit commencer par whsec_
    // Si ce n'est pas le cas, on l'ajoute
    const secretToUse = webhookSecret.startsWith('whsec_') 
      ? webhookSecret 
      : `whsec_${webhookSecret}`;
    
    console.log('Tentative de vérification avec secret (premiers caractères):', secretToUse.substring(0, 15) + '...');
    
    // Dans Deno, il faut utiliser constructEventAsync au lieu de constructEvent
    event = await stripe.webhooks.constructEventAsync(body, signature, secretToUse);
    console.log('✅ Webhook vérifié avec succès, type:', event.type);
  } catch (err: any) {
    console.error('❌ Erreur de vérification webhook:', err.message);
    console.error('Détails:', {
      signatureLength: signature.length,
      bodyLength: body.length,
      webhookSecretLength: webhookSecret.length,
      webhookSecretPrefix: webhookSecret.substring(0, Math.min(15, webhookSecret.length)) + '...',
      errorType: err.constructor.name,
      errorMessage: err.message
    });
    
    return new Response(
      JSON.stringify({ 
        error: `Webhook Error: ${err.message}`,
        hint: 'Vérifiez que STRIPE_WEBHOOK_SECRET dans Supabase correspond EXACTEMENT au "Signing secret" du webhook dans Stripe Dashboard. Allez dans Stripe Dashboard > Developers > Webhooks > votre webhook > section "Signing secret" et copiez la valeur complète (elle doit commencer par whsec_)'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await supabase
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_plan: 'premium',
              stripe_subscription_id: subscription.id,
              subscription_current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              subscription_cancel_at_period_end: subscription.cancel_at_period_end,
              subscription_updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const isActive = subscription.status === 'active';
          await supabase
            .from('users')
            .update({
              subscription_status: isActive ? 'premium' : 'expired',
              subscription_plan: isActive ? 'premium' : 'free',
              subscription_current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              subscription_cancel_at_period_end: subscription.cancel_at_period_end,
              subscription_updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'expired',
              subscription_plan: 'free',
              subscription_updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user && invoice.subscription) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_plan: 'premium',
              subscription_updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          console.log(`Paiement échoué pour l'utilisateur ${user.id}`);
          // Vous pouvez envoyer une notification ici
        }
        break;
      }
    }

    console.log('✅ Webhook traité avec succès');
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Erreur lors du traitement du webhook:', error);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur serveur',
        type: error.constructor.name
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


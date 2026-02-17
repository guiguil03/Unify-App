import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { Subscription, SubscriptionStatus, CreateCheckoutSessionData } from '../types/subscription';

export class SubscriptionService {
  /**
   * Récupère l'abonnement de l'utilisateur actuel
   */
  static async getSubscription(): Promise<Subscription | null> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          subscription_status,
          subscription_plan,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_current_period_start,
          subscription_current_period_end,
          subscription_cancel_at_period_end,
          subscription_created_at,
          subscription_updated_at
        `)
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;

      if (!user.subscription_status) {
        // Créer un abonnement gratuit par défaut
        return {
          id: user.id,
          userId: user.id,
          status: 'free',
          planType: 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: user.id,
        userId: user.id,
        status: user.subscription_status as SubscriptionStatus,
        planType: user.subscription_plan || 'free',
        stripeCustomerId: user.stripe_customer_id || undefined,
        stripeSubscriptionId: user.stripe_subscription_id || undefined,
        currentPeriodStart: user.subscription_current_period_start || undefined,
        currentPeriodEnd: user.subscription_current_period_end || undefined,
        cancelAtPeriodEnd: user.subscription_cancel_at_period_end || false,
        createdAt: user.subscription_created_at || new Date().toISOString(),
        updatedAt: user.subscription_updated_at || new Date().toISOString(),
      };
    } catch {
      // Pas connecté ou erreur réseau — retourne null silencieusement
      return null;
    }
  }

  /**
   * Crée une session de checkout Stripe pour un abonnement premium
   * Utilise Supabase Edge Function
   */
  static async createCheckoutSession(data: CreateCheckoutSessionData): Promise<{ url: string }> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Utiliser Supabase Edge Function
      // Le priceId peut être optionnel si configuré dans l'Edge Function
      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        'stripe-create-checkout',
        {
          body: {
            priceId: data.priceId || undefined, // Optionnel si configuré dans l'Edge Function
            userId: currentUser.id,
            successUrl: data.successUrl,
            cancelUrl: data.cancelUrl,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de la création de la session de checkout');
      }

      if (!responseData || !responseData.url) {
        throw new Error('URL de checkout non retournée');
      }

      return { url: responseData.url };
    } catch (error: any) {
      throw new Error(error.message || 'Impossible de créer la session de checkout');
    }
  }

  /**
   * Annule l'abonnement (annulation à la fin de la période)
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const subscription = await this.getSubscription();
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('Aucun abonnement trouvé');
      }

      // Utiliser Supabase Edge Function
      const { error: functionError } = await supabase.functions.invoke(
        'stripe-cancel-subscription',
        {
          body: {
            subscriptionId: subscription.stripeSubscriptionId,
            userId: currentUser.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de l\'annulation de l\'abonnement');
      }

      // Mettre à jour localement
      const { error } = await supabase
        .from('users')
        .update({
          subscription_cancel_at_period_end: true,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Impossible d\'annuler l\'abonnement');
    }
  }

  /**
   * Réactive un abonnement annulé
   */
  static async reactivateSubscription(): Promise<boolean> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const subscription = await this.getSubscription();
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('Aucun abonnement trouvé');
      }

      // Utiliser Supabase Edge Function
      const { error: functionError } = await supabase.functions.invoke(
        'stripe-reactivate-subscription',
        {
          body: {
            subscriptionId: subscription.stripeSubscriptionId,
            userId: currentUser.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de la réactivation de l\'abonnement');
      }

      // Mettre à jour localement
      const { error } = await supabase
        .from('users')
        .update({
          subscription_cancel_at_period_end: false,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Impossible de réactiver l\'abonnement');
    }
  }

  /**
   * Vérifie si l'utilisateur a un abonnement premium actif
   */
  static async isPremium(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;

    return subscription.status === 'premium' || subscription.status === 'trial';
  }
}

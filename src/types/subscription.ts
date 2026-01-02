export type SubscriptionStatus = 'free' | 'premium' | 'trial' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  planType: 'free' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutSessionData {
  priceId: string; // ID du prix Stripe
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}


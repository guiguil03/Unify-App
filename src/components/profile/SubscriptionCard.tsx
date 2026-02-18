import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { SubscriptionService } from '../../services/SubscriptionService';
import { Subscription, SubscriptionStatus } from '../../types/subscription';
import { COLORS } from '../../constants/colors';
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler';
import { getEnvOptional } from '../../utils/env';

export function SubscriptionCard() {
  const navigation = useNavigation<NavigationProp>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const sub = await SubscriptionService.getSubscription();
      setSubscription(sub);
    } catch (error) {
      if (__DEV__) console.error('Subscription load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      
      // Récupérer le Price ID depuis les variables d'environnement (optionnel si configuré dans l'Edge Function)
      const priceId = getEnvOptional('STRIPE_PRICE_ID');

      const { url } = await SubscriptionService.createCheckoutSession({
        priceId: priceId || '', // Peut être vide si configuré dans l'Edge Function
        successUrl: 'unify://subscription/success',
        cancelUrl: 'unify://subscription/cancel',
      });

      // Ouvrir l'URL de checkout dans le navigateur
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
      }
    } catch (error: any) {
      showErrorToast(error.message || 'Impossible de créer la session de paiement');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Votre abonnement sera annulé à la fin de la période en cours. Vous continuerez à bénéficier des fonctionnalités premium jusqu\'à cette date.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await SubscriptionService.cancelSubscription();
              showSuccessToast('Abonnement annulé avec succès');
              await loadSubscription();
            } catch (error: any) {
              showErrorToast(error.message || 'Erreur lors de l\'annulation');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    try {
      setProcessing(true);
      await SubscriptionService.reactivateSubscription();
      showSuccessToast('Abonnement réactivé avec succès');
      await loadSubscription();
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors de la réactivation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status?: SubscriptionStatus) => {
    switch (status) {
      case 'premium':
        return COLORS.success;
      case 'trial':
        return '#FFA500';
      case 'expired':
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const getStatusLabel = (status?: SubscriptionStatus) => {
    switch (status) {
      case 'premium':
        return 'Premium';
      case 'trial':
        return 'Essai';
      case 'expired':
        return 'Expiré';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Gratuit';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const isPremium = subscription?.status === 'premium' || subscription?.status === 'trial';
  const isCancelled = subscription?.cancelAtPeriodEnd;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={isPremium ? 'crown' : 'crown-outline'}
            size={24}
            color={isPremium ? '#FFD700' : COLORS.textLight}
          />
          <Text style={styles.title}>Abonnement</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(subscription?.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(subscription?.status) },
            ]}
          >
            {getStatusLabel(subscription?.status)}
          </Text>
        </View>
      </View>

      {isPremium ? (
        <>
          <View style={styles.premiumContent}>
            <View style={styles.featureList}>
              <FeatureItem icon="lightning-bolt" text="Matching instantané" />
              <FeatureItem icon="gender-male-female" text="Modes de connexion (F/H/Mixte)" />
              <FeatureItem icon="account-heart" text="Rencontres illimitées" />
              <FeatureItem icon="map-marker" text="Partage de position" />
              <FeatureItem icon="shield-check" text="Vérification d'identité avancée + badge exclusif" />
              <FeatureItem icon="headset" text="Assistance prioritaire" />
              <FeatureItem icon="chart-line" text="Statistiques avancées" />
              <FeatureItem icon="whistle" text="Coaching personnalisé" />
              <FeatureItem icon="calendar-star" text="Accès aux évènements" />
              <FeatureItem icon="account-group" text="Accès aux groupes privés" />
            </View>

            {subscription?.currentPeriodEnd && (
              <View style={styles.dateInfo}>
                <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textLight} />
                <Text style={styles.dateText}>
                  {isCancelled
                    ? `Expire le ${formatDate(subscription.currentPeriodEnd)} (annulé)`
                    : `Renouvelé le ${formatDate(subscription.currentPeriodEnd)}`}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.routesButton]}
              onPress={() => navigation.navigate('Routes')}
            >
              <MaterialCommunityIcons name="map" size={20} color="white" />
              <Text style={styles.buttonText}>Mes parcours</Text>
            </TouchableOpacity>

            {isCancelled ? (
              <TouchableOpacity
                style={[styles.button, styles.reactivateButton]}
                onPress={handleReactivate}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="refresh" size={20} color="white" />
                    <Text style={styles.buttonText}>Réactiver l'abonnement</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={COLORS.error} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.error} />
                    <Text style={[styles.buttonText, styles.cancelButtonText]}>
                      Annuler l'abonnement
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.freeContent}>
          <Text style={styles.description}>
            Passez à Premium pour débloquer toutes les fonctionnalités et améliorer votre
            expérience de course.
          </Text>

          <View style={styles.featureList}>
            <FeatureItem icon="lightning-bolt" text="Matching instantané" />
            <FeatureItem icon="gender-male-female" text="Modes de connexion (F/H/Mixte)" />
            <FeatureItem icon="account-heart-outline" text="Rencontres limitées (2 par mois)" />
            <FeatureItem icon="map-marker-outline" text="Partage de position" />
            <FeatureItem icon="shield-check-outline" text="Vérification d'identité (basique)" />
            <FeatureItem icon="lifebuoy" text="Assistance" />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.upgradeButton]}
            onPress={handleUpgrade}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="crown" size={20} color="white" />
                <Text style={styles.buttonText}>Passer à Premium</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.priceText}>9.99€ / mois</Text>
        </View>
      )}
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color={COLORS.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  premiumContent: {
    gap: 16,
  },
  freeContent: {
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  reactivateButton: {
    backgroundColor: COLORS.success,
  },
  routesButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: COLORS.error,
  },
  priceText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
});

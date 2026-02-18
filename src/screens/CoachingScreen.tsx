import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { COLORS } from '../constants/colors';
import { NavigationProp } from '../types/navigation';

interface Tip {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const COACHING_TIPS: Tip[] = [
  {
    icon: 'run-fast',
    title: 'Allure et endurance',
    // eslint-disable-next-line quotes
    description: "Commencez par des sorties longues et lentes (60-70% de votre FCmax) pour developper votre endurance de base. La regle des 10% : n'augmentez jamais votre kilometrage hebdomadaire de plus de 10%.",
    color: '#7D80F4',
  },
  {
    icon: 'heart-pulse',
    title: 'Zone cardiaque',
    // eslint-disable-next-line quotes
    description: "Entrainez-vous principalement en zone 2 (65-75% FCmax). Cela ameliore l'efficacite metabolique et reduit le risque de blessure. Reservez 20% de vos seances a des efforts plus intenses.",
    color: '#F47D80',
  },
  {
    icon: 'lightning-bolt',
    title: 'Fractionne',
    // eslint-disable-next-line quotes
    description: "Integrez 1 a 2 seances de fractionne par semaine (ex : 8x400m a 95% FCmax). Le fractionne ameliore votre VO2max et votre vitesse maximale aerobie.",
    color: '#F4C430',
  },
  {
    icon: 'sleep',
    title: 'Recuperation',
    // eslint-disable-next-line quotes
    description: "Le repos est aussi important que l'entrainement. Dormez 7 a 9h par nuit. Integrez au moins 1 jour de repos complet par semaine, et une semaine allegee tous les 3-4 semaines.",
    color: '#4CAF50',
  },
  {
    icon: 'food-apple',
    title: 'Nutrition & hydratation',
    // eslint-disable-next-line quotes
    description: "Consommez des glucides complexes avant une longue sortie. Hydratez-vous (2-3L/jour). Pour les sorties de plus d'1h, prevoyez une source d'energie rapide (gels, dattes, banane).",
    color: '#FF9800',
  },
  {
    icon: 'stretch',
    title: 'Renforcement musculaire',
    // eslint-disable-next-line quotes
    description: "Renforcez vos jambes et votre core 2x par semaine : squats, fentes, gainage, mollets. Un core solide ameliore la stabilite et previent les blessures aux genoux et hanches.",
    color: '#9C27B0',
  },
];

const WEEKLY_PLANS = [
  { day: 'Lundi', workout: 'Repos ou yoga léger', type: 'rest' },
  { day: 'Mardi', workout: 'Fractionné — 6x500m', type: 'intense' },
  { day: 'Mercredi', workout: 'Course récup 30min (zone 1)', type: 'easy' },
  { day: 'Jeudi', workout: 'Tempo run 40min (zone 3)', type: 'moderate' },
  { day: 'Vendredi', workout: 'Repos', type: 'rest' },
  { day: 'Samedi', workout: 'Sortie longue 1h-1h30 (zone 2)', type: 'long' },
  { day: 'Dimanche', workout: 'Renforcement musculaire', type: 'strength' },
];

const typeColors: Record<string, string> = {
  rest: '#e0e0e0',
  intense: '#FFCDD2',
  easy: '#C8E6C9',
  moderate: '#FFF9C4',
  long: '#C5CAE9',
  strength: '#E1BEE7',
};

const typeTextColors: Record<string, string> = {
  rest: '#666',
  intense: '#C62828',
  easy: '#2E7D32',
  moderate: '#F57F17',
  long: '#283593',
  strength: '#6A1B9A',
};

export default function CoachingScreen() {
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumRequired}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="whistle" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.premiumTitle}>Coaching personnalisé</Text>
          <Text style={styles.premiumText}>
            Accédez à des plans d'entraînement, des conseils d'experts et un coaching adapté à votre niveau pour progresser plus vite.
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="clipboard-list" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Plans d'entraînement sur mesure</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Analyse de votre progression</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Conseils d'experts en course à pied</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Objectifs personnalisés</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons name="crown" size={20} color="white" />
            <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Plan de la semaine */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan de la semaine</Text>
        <View style={styles.weeklyPlan}>
          {WEEKLY_PLANS.map((item) => (
            <View key={item.day} style={styles.dayRow}>
              <Text style={styles.dayName}>{item.day}</Text>
              <View style={[styles.workoutBadge, { backgroundColor: typeColors[item.type] }]}>
                <Text style={[styles.workoutText, { color: typeTextColors[item.type] }]}>
                  {item.workout}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Conseils d'entraînement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conseils d'entraînement</Text>
        {COACHING_TIPS.map((tip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tipCard}
            onPress={() => setExpandedTip(expandedTip === index ? null : index)}
            activeOpacity={0.85}
          >
            <View style={styles.tipHeader}>
              <View style={[styles.tipIconContainer, { backgroundColor: tip.color + '20' }]}>
                <MaterialCommunityIcons name={tip.icon as any} size={22} color={tip.color} />
              </View>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <MaterialCommunityIcons
                name={expandedTip === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#999"
              />
            </View>
            {expandedTip === index && (
              <Text style={styles.tipDescription}>{tip.description}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Badge coach */}
      <View style={[styles.section, styles.coachBanner]}>
        <MaterialCommunityIcons name="crown" size={28} color="#FFD700" />
        <View style={styles.coachBannerText}>
          <Text style={styles.coachBannerTitle}>Coach Premium actif</Text>
          <Text style={styles.coachBannerSub}>Votre plan est mis à jour chaque semaine selon vos performances</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  // Premium gate
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    marginBottom: 28,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Content
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  weeklyPlan: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  dayName: {
    width: 72,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  workoutBadge: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workoutText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tipDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  coachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D80F420',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    marginBottom: 32,
  },
  coachBannerText: {
    flex: 1,
  },
  coachBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  coachBannerSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

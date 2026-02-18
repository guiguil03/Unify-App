import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const SOCIALS = [
  { icon: 'instagram', label: '@unify.run', url: 'https://instagram.com/unify.run', color: '#E1306C' },
  { icon: 'twitter', label: '@UnifyRun', url: 'https://twitter.com/UnifyRun', color: '#1DA1F2' },
  { icon: 'web', label: 'unify.app', url: 'https://unify.app', color: '#7D80F4' },
];

const TEAM = [
  { name: 'Guillaume D.', role: 'Fondateur & Dev' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>U</Text>
        </View>
        <Text style={styles.appName}>Unify</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
        <Text style={styles.tagline}>La communauté des coureurs qui se connectent</Text>
      </View>

      {/* Mission */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="heart-pulse" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Notre mission</Text>
        </View>
        <Text style={styles.cardText}>
          Unify connecte les coureurs entre eux pour qu'ils ne courent plus jamais seuls.
          Que tu cherches un partenaire d'entraînement, une motivation quotidienne ou simplement
          à partager ta passion, Unify est fait pour toi.
        </Text>
      </View>

      {/* Fonctionnalités clés */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="star-four-points" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Ce qu'on propose</Text>
        </View>
        {[
          { icon: 'map-marker-radius', text: 'Trouve des coureurs près de chez toi en temps réel' },
          { icon: 'run', text: 'Enregistre et partage tes activités' },
          { icon: 'account-group', text: 'Rejoins des groupes de discussion privés' },
          { icon: 'chart-line', text: 'Suis ta progression avec des stats avancées (Premium)' },
          { icon: 'whistle', text: 'Accède à un coaching personnalisé (Premium)' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Équipe */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-star" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitle}>L'équipe</Text>
        </View>
        {TEAM.map((member, i) => (
          <View key={i} style={styles.teamMember}>
            <View style={styles.teamAvatar}>
              <Text style={styles.teamAvatarLetter}>{member.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Réseaux sociaux */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Nous suivre</Text>
        </View>
        {SOCIALS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.socialRow}
            onPress={() => Linking.openURL(s.url)}
            activeOpacity={0.7}
          >
            <View style={[styles.socialIcon, { backgroundColor: s.color + '18' }]}>
              <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={styles.socialLabel}>{s.label}</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#bbb" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2026 Unify — Fait avec ❤️ pour les coureurs</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: { fontSize: 40, fontWeight: '900', color: 'white', fontStyle: 'italic' },
  appName: { fontSize: 32, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, fontStyle: 'italic' },
  versionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
  },
  versionText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  tagline: { marginTop: 12, fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cardText: { fontSize: 14, color: '#555', lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  teamMember: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamAvatarLetter: { fontSize: 20, fontWeight: '700', color: 'white' },
  teamName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  teamRole: { fontSize: 13, color: '#888', marginTop: 2 },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  socialIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  socialLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 13, color: '#bbb', paddingVertical: 24, paddingBottom: 40 },
});

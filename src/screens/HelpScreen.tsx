import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface FaqItem {
  question: string;
  answer: string;
  icon: string;
}

const FAQ: FaqItem[] = [
  {
    icon: 'map-marker-radius',
    question: 'Comment trouver des coureurs près de moi ?',
    answer:
      'Va sur l onglet "Carte" depuis le menu de navigation. Appuie sur l icône de réglages pour définir ta zone de recherche, choisis un rayon, puis valide. Les coureurs à proximité apparaîtront sur la carte et dans la liste en bas.',
  },
  {
    icon: 'account-plus',
    question: 'Comment envoyer une demande de contact ?',
    answer:
      'Appuie sur le profil d un coureur sur la carte ou dans la liste, puis sur le bouton "Se connecter". En version gratuite, tu peux envoyer 2 demandes par mois. Avec Premium, les rencontres sont illimitées.',
  },
  {
    icon: 'run',
    question: 'Comment enregistrer une activité ?',
    answer:
      'Rends-toi sur l écran "Courir" (icône course à pied dans la navigation). Lance le suivi GPS, cours, puis arrête la session. Ton activité sera enregistrée automatiquement.',
  },
  {
    icon: 'account-group',
    question: 'Comment créer un groupe de discussion ?',
    answer:
      'Va dans "Messages", sélectionne l onglet "Groupes" puis appuie sur le bouton "+". La création de groupes est une fonctionnalité Premium.',
  },
  {
    icon: 'shield-check',
    question: 'Comment vérifier mon identité ?',
    answer:
      'Depuis "Paramètres", section "Sécurité", appuie sur "Vérifier mon identité". Tu devras soumettre une photo de pièce d identité. La vérification prend généralement 24 à 48 heures.',
  },
  {
    icon: 'crown',
    question: 'Que contient l abonnement Premium ?',
    answer:
      'Premium donne accès à : rencontres illimitées, statistiques avancées, coaching personnalisé, accès aux événements, groupes privés, vérification avancée + badge exclusif, et une assistance prioritaire.',
  },
  {
    icon: 'delete-alert',
    question: 'Comment supprimer mon compte ?',
    answer:
      'Va dans "Paramètres" → "Données" → "Supprimer mon compte". Cette action est irréversible et supprime définitivement toutes tes données.',
  },
  {
    icon: 'lock-reset',
      question: 'J ai oublié mon mot de passe, que faire ?',
    answer:
      'Sur l écran de connexion, appuie sur "Mot de passe oublié ?". Entre ton adresse email et tu recevras un lien de réinitialisation.',
  },
];

export default function HelpScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="lifebuoy" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Centre d'aide</Text>
        <Text style={styles.headerSub}>Trouve une réponse rapide ci-dessous, ou contacte-nous.</Text>
      </View>

      {/* FAQ */}
      <Text style={styles.sectionLabel}>Questions fréquentes</Text>
      <View style={styles.faqList}>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, openIndex === i && styles.faqCardOpen]}
            onPress={() => toggle(i)}
            activeOpacity={0.85}
          >
            <View style={styles.faqHeader}>
              <View style={styles.faqIconWrap}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <MaterialCommunityIcons
                name={openIndex === i ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#aaa"
              />
            </View>
            {openIndex === i && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact */}
      <Text style={styles.sectionLabel}>Contacter le support</Text>
      <View style={styles.contactCard}>
        <View style={styles.contactRow}>
          <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#4CAF50" />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactValue}>support@unify.app</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@unify.app')}>
            <MaterialCommunityIcons name="open-in-new" size={18} color="#bbb" />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        <View style={styles.contactRow}>
          <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#2196F3" />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Délai de réponse</Text>
            <Text style={styles.contactValue}>Sous 24–48h (lun–ven)</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.contactRow}>
          <View style={[styles.contactIcon, { backgroundColor: '#FFF8E1' }]}>
            <MaterialCommunityIcons name="crown" size={22} color="#FFB300" />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Support Premium</Text>
            <Text style={styles.contactValue}>Réponse prioritaire en moins de 4h</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  headerSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  faqList: { marginHorizontal: 16, gap: 8 },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  faqCardOpen: { borderColor: COLORS.primary + '40' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a', lineHeight: 20 },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    paddingLeft: 44,
  },
  contactCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: { flex: 1 },
  contactTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  contactValue: { fontSize: 13, color: '#888', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#f5f5f5', marginHorizontal: 14 },
});

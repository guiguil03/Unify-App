import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface Section {
  icon: string;
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'database-outline',
    title: '1. Données collectées',
    content:
      'Nous collectons les données que vous nous fournissez directement : nom, adresse email, photo de profil, genre, date de naissance, biographie.\n\nDonnées d utilisation : localisation GPS (uniquement pendant l utilisation), activités sportives enregistrées, historique des connexions, préférences de course.\n\nDonnées techniques : identifiant de l appareil, système d exploitation, version de l application, logs d erreurs.',
  },
  {
    icon: 'cog-outline',
    title: '2. Utilisation des données',
    content:
      'Vos données sont utilisées pour :\n• Fournir et améliorer les fonctionnalités de l application\n• Afficher votre profil et votre position aux coureurs à proximité (avec votre consentement)\n• Vous mettre en relation avec d autres utilisateurs\n• Gérer votre abonnement Premium\n• Vous envoyer des notifications liées à l application\n• Assurer la sécurité et prévenir les abus',
  },
  {
    icon: 'map-marker-off-outline',
    title: '3. Géolocalisation',
    content:
      'La localisation GPS est utilisée uniquement lorsque vous l activez dans l application (carte, activités). Vous pouvez activer l option "Masquer ma position exacte" dans les paramètres pour n afficher qu une zone approximative. Votre localisation n est jamais partagée sans votre consentement explicite.',
  },
  {
    icon: 'share-off-outline',
    title: '4. Partage des données',
    content:
      'Nous ne vendons jamais vos données personnelles à des tiers.\n\nNous pouvons partager vos données avec :\n• Nos prestataires techniques (hébergement, paiement via Stripe)\n• Les autorités compétentes en cas d obligation légale\n\nVos données sont hébergées sur des serveurs sécurisés (Supabase / AWS) situés dans l Union Européenne.',
  },
  {
    icon: 'lock-outline',
    title: '5. Sécurité',
    content:
      'Nous appliquons des mesures techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS), accès restreint aux données, authentification sécurisée, politiques de sécurité au niveau de la base de données (RLS).',
  },
  {
    icon: 'account-clock-outline',
    title: '6. Durée de conservation',
    content:
      'Vos données sont conservées aussi longtemps que votre compte est actif. Après suppression du compte, vos données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale de conservation.',
  },
  {
    icon: 'human-greeting-variant',
    title: '7. Vos droits (RGPD)',
    content:
      'Conformément au RGPD, vous disposez des droits suivants :\n• Droit d accès à vos données\n• Droit de rectification\n• Droit à l effacement ("droit à l oubli")\n• Droit à la portabilité\n• Droit d opposition au traitement\n• Droit de limitation du traitement\n\nPour exercer ces droits, contactez-nous à privacy@unify.app.',
  },
  {
    icon: 'cookie-outline',
    title: '8. Cookies et traceurs',
    content:
      'L application mobile n utilise pas de cookies. Nous utilisons des identifiants techniques anonymisés uniquement pour améliorer la stabilité de l application et analyser les performances.',
  },
  {
    icon: 'child-outline',
    title: '9. Mineurs',
    content:
      'L application est destinée aux personnes majeures (18 ans ou plus). Nous ne collectons pas sciemment de données concernant des mineurs. Si vous constatez qu un mineur a créé un compte, contactez-nous pour qu il soit supprimé.',
  },
  {
    icon: 'pencil-outline',
    title: '10. Modifications',
    content:
      'Nous nous réservons le droit de modifier cette politique à tout moment. Les modifications seront communiquées via l application. La poursuite de l utilisation de l application après notification vaut acceptation des modifications.',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-lock-outline" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <Text style={styles.headerSub}>Dernière mise à jour : 18 février 2026</Text>
        <View style={styles.rgpdBadge}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
          <Text style={styles.rgpdText}>Conforme RGPD</Text>
        </View>
      </View>

      {/* Sections */}
      <View style={styles.content}>
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons name={section.icon as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionText}>{section.content}</Text>
          </View>
        ))}
      </View>

      {/* Contact DPO */}
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Contacter notre DPO</Text>
        </View>
        <Text style={styles.contactText}>
          Pour toute question relative à vos données personnelles, écrivez-nous à :
        </Text>
        <TouchableOpacity
          style={styles.contactEmailBtn}
          onPress={() => Linking.openURL('mailto:privacy@unify.app')}
        >
          <Text style={styles.contactEmail}>privacy@unify.app</Text>
          <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.contactAuthority}>
          Vous pouvez également déposer une réclamation auprès de la CNIL (www.cnil.fr).
        </Text>
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
    marginBottom: 12,
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 6, textAlign: 'center' },
  headerSub: { fontSize: 13, color: '#aaa', marginBottom: 12 },
  rgpdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rgpdText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  content: { paddingHorizontal: 16, gap: 10 },
  section: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  sectionText: { fontSize: 14, color: '#555', lineHeight: 22 },
  contactCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  contactText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },
  contactEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  contactEmail: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  contactAuthority: { fontSize: 13, color: '#999', lineHeight: 18 },
});

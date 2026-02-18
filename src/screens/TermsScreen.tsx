import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface Section {
  title: string;
  icon: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'information-outline',
    title: '1. Objet',
    content:
      'Les présentes Conditions Générales d Utilisation (CGU) régissent l accès et l utilisation de l application mobile Unify (ci-après "l Application"). En accédant à l Application, vous acceptez sans réserve les présentes CGU.',
  },
  {
    icon: 'account-check',
    title: '2. Inscription et compte',
    content:
      'L accès à certaines fonctionnalités nécessite la création d un compte. Vous vous engagez à fournir des informations exactes, complètes et à jour lors de votre inscription. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités qui se déroulent sous votre compte.',
  },
  {
    icon: 'run',
    title: '3. Utilisation de l application',
    content:
      'L Application est destinée à des personnes majeures souhaitant pratiquer la course à pied et se connecter avec d autres coureurs. Il est interdit d utiliser l Application à des fins illégales, de publier du contenu offensant, trompeur ou portant atteinte aux droits de tiers, de harceler, menacer ou intimider d autres utilisateurs, ou d utiliser des robots ou systèmes automatisés pour interagir avec l Application.',
  },
  {
    icon: 'image-outline',
    title: '4. Contenu utilisateur',
    content:
      'Vous conservez la propriété de tout contenu (photos, textes, activités) que vous publiez sur l Application. En publiant du contenu, vous accordez à Unify une licence mondiale, non exclusive, gratuite et transférable pour utiliser, reproduire, modifier et afficher ce contenu dans le cadre du fonctionnement de l Application.',
  },
  {
    icon: 'crown-outline',
    title: '5. Abonnement Premium',
    content:
      'Certaines fonctionnalités sont réservées aux abonnés Premium. L abonnement est payant et se renouvelle automatiquement sauf résiliation au moins 24 heures avant la date de renouvellement. Vous pouvez gérer ou annuler votre abonnement depuis les paramètres de votre compte.',
  },
  {
    icon: 'shield-alert-outline',
    title: '6. Responsabilité',
    content:
      'L Application est fournie "en l état". Unify ne saurait être tenu responsable des dommages directs ou indirects résultant de l utilisation ou de l impossibilité d utiliser l Application. Les rencontres entre utilisateurs se font à leurs risques et périls. Unify encourage ses utilisateurs à prendre toutes les précautions nécessaires lors de rencontres physiques.',
  },
  {
    icon: 'account-remove-outline',
    title: '7. Résiliation',
    content:
      'Unify se réserve le droit de suspendre ou de résilier votre compte en cas de violation des présentes CGU, sans préavis ni indemnité. Vous pouvez également supprimer votre compte à tout moment depuis les paramètres de l Application.',
  },
  {
    icon: 'scale-balance',
    title: '8. Droit applicable',
    content:
      'Les présentes CGU sont régies par le droit français. En cas de litige, les parties s efforceront de trouver une solution amiable. À défaut d accord, les tribunaux français seront compétents.',
  },
  {
    icon: 'pencil-outline',
    title: '9. Modifications',
    content:
      'Unify se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l utilisation de l Application après notification vaut acceptation des nouvelles CGU.',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="file-document-outline" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <Text style={styles.headerSub}>Dernière mise à jour : 18 février 2026</Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons name="email-outline" size={16} color="#aaa" />
        <Text style={styles.footerText}>Pour toute question : legal@unify.app</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  headerSub: { fontSize: 13, color: '#aaa' },
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  footerText: { fontSize: 13, color: '#aaa' },
});

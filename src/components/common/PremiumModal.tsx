import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature?: string;
}

export function PremiumModal({ visible, onClose, onUpgrade, feature }: PremiumModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>

          {/* Icône couronne */}
          <View style={styles.crownWrap}>
            <MaterialCommunityIcons name="crown" size={36} color="#FFD700" />
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>

          {/* Titre */}
          <Text style={styles.title}>Fonctionnalité{'\n'}exclusive</Text>

          {/* Description */}
          <Text style={styles.description}>
            {feature
              ? `${feature} est réservé aux abonnés Premium.`
              : 'Cette fonctionnalité est réservée aux abonnés Premium.'}
            {'\n'}Rejoignez Premium pour en profiter !
          </Text>

          {/* Avantages */}
          <View style={styles.perks}>
            <PerkRow icon="account-group-outline" label="Groupes de discussion privés" />
            <PerkRow icon="map-marker-path" label="Parcours personnalisés" />
            <PerkRow icon="chart-line" label="Statistiques avancées" />
            <PerkRow icon="shield-check" label="Vérification prioritaire" />
          </View>

          {/* Bouton upgrade */}
          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.85}>
            <MaterialCommunityIcons name="crown-outline" size={18} color="white" />
            <Text style={styles.upgradeBtnText}>Passer à Premium — 9.99€/mois</Text>
          </TouchableOpacity>

          {/* Lien fermer */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.6} style={styles.closeLink}>
            <Text style={styles.closeLinkText}>Plus tard</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PerkRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.perkRow}>
      <View style={styles.perkIcon}>
        <MaterialCommunityIcons name={icon as any} size={16} color={COLORS.primary} />
      </View>
      <Text style={styles.perkLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },

  // Couronne
  crownWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  // Badge
  badge: {
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },

  // Textes
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },

  // Avantages
  perks: {
    width: '100%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Bouton
  upgradeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  // Lien fermer
  closeLink: {
    paddingVertical: 4,
  },
  closeLinkText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});

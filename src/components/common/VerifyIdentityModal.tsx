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

interface VerifyIdentityModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
}

export function VerifyIdentityModal({ visible, onClose, onVerify }: VerifyIdentityModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>

          {/* Icône */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="shield-account" size={38} color={COLORS.primary} />
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VÉRIFICATION REQUISE</Text>
          </View>

          {/* Titre */}
          <Text style={styles.title}>Vérifiez votre{'\n'}identité d'abord</Text>

          {/* Description */}
          <Text style={styles.description}>
            Pour garantir la sécurité de tous les coureurs, vous devez vérifier votre identité avant de vous connecter avec d'autres membres.
          </Text>

          {/* Étapes */}
          <View style={styles.steps}>
            <StepRow icon="card-account-details-outline" label="Préparez une pièce d'identité valide" />
            <StepRow icon="camera-face" label="Prenez un selfie pour le face match" />
            <StepRow icon="clock-fast" label="Résultat en quelques minutes" />
          </View>

          {/* Bouton principal */}
          <TouchableOpacity style={styles.verifyBtn} onPress={onVerify} activeOpacity={0.85}>
            <MaterialCommunityIcons name="shield-check" size={18} color="white" />
            <Text style={styles.verifyBtnText}>Vérifier mon identité</Text>
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

function StepRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        <MaterialCommunityIcons name={icon as any} size={16} color={COLORS.primary} />
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
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
    backgroundColor: '#fff',
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
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  steps: {
    width: '100%',
    backgroundColor: '#F4F4F8',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  verifyBtn: {
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
  verifyBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  closeLink: {
    paddingVertical: 4,
  },
  closeLinkText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
});

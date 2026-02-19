import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { IdentityVerificationService } from '../../services/IdentityVerificationService';
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler';
import { COLORS } from '../../constants/colors';

interface IdentityVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IdentityVerificationModal({
  visible,
  onClose,
  onSuccess,
}: IdentityVerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const verification = await IdentityVerificationService.createPendingVerification();
      const sessionUrl = await IdentityVerificationService.submitToDidit(verification.id);

      showSuccessToast('Vérification lancée ! Complétez-la dans le navigateur.');
      onSuccess();
      onClose();

      await Linking.openURL(sessionUrl);
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors du lancement de la vérification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => { if (!isSubmitting) onClose(); }}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Vérification d'identité</Text>
              <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Confirmez votre identité pour rassurer vos partenaires de course et obtenir le badge vérifié.
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name="card-account-details-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>Préparez votre pièce d'identité (carte nationale, passeport ou permis)</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name="camera-face" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>Prenez un selfie pour la vérification faciale</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>Résultat en quelques minutes — conforme RGPD</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.startButton, isSubmitting && styles.startButtonDisabled]}
              onPress={handleStart}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-check" size={20} color="white" />
                  <Text style={styles.startButtonText}>Démarrer la vérification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    paddingTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

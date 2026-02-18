import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [idDocumentFront, setIdDocumentFront] = useState<string | null>(null);
  const [idDocumentBack, setIdDocumentBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idDocumentFrontUri, setIdDocumentFrontUri] = useState<string | null>(null);
  const [idDocumentBackUri, setIdDocumentBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin d'accéder à vos photos.", [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin d'accéder à votre caméra.", [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    if (!await requestGalleryPermission()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri, type);
    }
  };

  const takePicture = async (type: 'front' | 'back' | 'selfie') => {
    if (!await requestCameraPermission()) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri, type);
    }
  };

  const showPickerOptions = (type: 'front' | 'back' | 'selfie') => {
    Alert.alert(
      'Choisir une photo',
      '',
      [
        { text: 'Prendre une photo', onPress: () => takePicture(type) },
        { text: 'Depuis la galerie', onPress: () => pickImage(type) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const uploadImage = async (uri: string, type: 'front' | 'back' | 'selfie') => {
    setUploadingImage(type);
    try {
      const fileName = type === 'front' ? 'id_front' : type === 'back' ? 'id_back' : 'selfie';
      const filePath = await IdentityVerificationService.uploadIdentityDocument(uri, fileName);

      if (type === 'front') { setIdDocumentFront(filePath); setIdDocumentFrontUri(uri); }
      else if (type === 'back') { setIdDocumentBack(filePath); setIdDocumentBackUri(uri); }
      else { setSelfie(filePath); setSelfieUri(uri); }

    } catch (error: any) {
      showErrorToast(error.message || 'Impossible de télécharger le document');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!idDocumentFront) {
      showErrorToast("Ajoutez une photo de votre pièce d'identité (recto)");
      return;
    }
    if (!selfie) {
      showErrorToast('Ajoutez un selfie pour la vérification faciale');
      return;
    }

    setIsSubmitting(true);
    try {
      const verification = await IdentityVerificationService.submitVerification({
        idDocumentFrontUrl: idDocumentFront,
        idDocumentBackUrl: idDocumentBack || undefined,
        selfieUrl: selfie,
      });

      await IdentityVerificationService.submitToDidit(verification.id);

      showSuccessToast('Vérification soumise ! Résultat sous quelques minutes.');
      onSuccess();
      onClose();
      resetState();
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setIdDocumentFront(null); setIdDocumentBack(null); setSelfie(null);
    setIdDocumentFrontUri(null); setIdDocumentBackUri(null); setSelfieUri(null);
  };

  const handleClose = () => {
    if (!isSubmitting) { onClose(); }
  };

  const renderUploadSlot = (
    type: 'front' | 'back' | 'selfie',
    title: string,
    description: string,
    required: boolean,
    uri: string | null,
    path: string | null,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {required && <View style={styles.requiredBadge}><Text style={styles.requiredText}>Requis</Text></View>}
      </View>
      <Text style={styles.sectionDescription}>{description}</Text>

      {uri && path ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => showPickerOptions(type)}
            disabled={isSubmitting || uploadingImage !== null}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
            <Text style={styles.changeButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, uploadingImage === type && styles.uploadButtonLoading]}
          onPress={() => showPickerOptions(type)}
          disabled={isSubmitting || uploadingImage !== null}
        >
          {uploadingImage === type ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>Ajouter une photo</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Vérification d'identité</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Soumettez vos documents pour confirmer votre identité et rassurer vos partenaires de course.
            </Text>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderUploadSlot('front', "Pièce d'identité — Recto", 'Carte nationale, passeport ou permis de conduire', true, idDocumentFrontUri, idDocumentFront)}
            {renderUploadSlot('back', "Pièce d'identité — Verso", 'Optionnel mais recommandé', false, idDocumentBackUri, idDocumentBack)}
            {renderUploadSlot('selfie', 'Selfie', 'Photo de votre visage pour le face match', true, selfieUri, selfie)}

            <View style={styles.gdprNotice}>
              <MaterialCommunityIcons name="shield-lock" size={16} color={COLORS.textLight} />
              <Text style={styles.gdprText}>
                Vos documents sont chiffrés, traités automatiquement et supprimés dès validation. Conforme RGPD.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, (!idDocumentFront || !selfie || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!idDocumentFront || !selfie || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Soumettre pour vérification</Text>
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
    maxHeight: '92%',
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredBadge: {
    backgroundColor: '#FFF0F0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredText: {
    fontSize: 11,
    color: '#E53E3E',
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FAFAFA',
  },
  uploadButtonLoading: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  imagePreview: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  changeButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  gdprNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  gdprText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

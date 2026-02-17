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
  KeyboardAvoidingView,
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

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Pour le selfie, permettre aussi la caméra
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };

      if (type === 'selfie') {
        options.aspect = [1, 1]; // Carré pour le selfie
      } else {
        options.aspect = [16, 9]; // Paysage pour les documents
      }

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadImage(asset.uri, type);
      }
    } catch (error) {
      showErrorToast('Impossible de sélectionner l\'image');
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour utiliser la caméra.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadImage(asset.uri, 'selfie');
      }
    } catch (error) {
      showErrorToast('Impossible de prendre la photo');
    }
  };

  const uploadImage = async (uri: string, type: 'front' | 'back' | 'selfie') => {
    setUploadingImage(type);
    try {
      const fileName = type === 'front' ? 'id_front' : type === 'back' ? 'id_back' : 'selfie';
      const filePath = await IdentityVerificationService.uploadIdentityDocument(uri, fileName);

      if (type === 'front') {
        setIdDocumentFront(filePath);
        setIdDocumentFrontUri(uri);
      } else if (type === 'back') {
        setIdDocumentBack(filePath);
        setIdDocumentBackUri(uri);
      } else {
        setSelfie(filePath);
        setSelfieUri(uri);
      }

      showSuccessToast('Document téléchargé avec succès');
    } catch (error: any) {
      showErrorToast(error.message || 'Impossible de télécharger le document');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!idDocumentFront) {
      showErrorToast('Veuillez ajouter une photo de votre pièce d\'identité (recto)');
      return;
    }

    if (!selfie) {
      showErrorToast('Veuillez ajouter un selfie pour la vérification faciale');
      return;
    }

    setIsSubmitting(true);
    try {
      const verification = await IdentityVerificationService.submitVerification({
        idDocumentFrontUrl: idDocumentFront,
        idDocumentBackUrl: idDocumentBack || undefined,
        selfieUrl: selfie || undefined,
      });

      // Soumettre à didit pour vérification automatique
      await IdentityVerificationService.submitToDidit(verification.id);

      showSuccessToast('Vérification soumise. Résultats sous quelques minutes.');
      onSuccess();
      onClose();
      // Reset
      setIdDocumentFront(null);
      setIdDocumentBack(null);
      setSelfie(null);
      setIdDocumentFrontUri(null);
      setIdDocumentBackUri(null);
      setSelfieUri(null);
    } catch (error: any) {
      showErrorToast(error.message || 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Vérification d'identité</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Pour garantir la sécurité de notre communauté, nous vérifions l'identité de nos utilisateurs.
              Veuillez fournir les documents suivants :
            </Text>

            {/* Pièce d'identité recto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pièce d'identité - Recto *</Text>
              <Text style={styles.sectionDescription}>
                Photo de votre carte d'identité, passeport ou permis de conduire (recto)
              </Text>
              {idDocumentFront && idDocumentFrontUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: idDocumentFrontUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => pickImage('front')}
                    disabled={isSubmitting || uploadingImage === 'front'}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                    <Text style={styles.changeButtonText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('front')}
                  disabled={isSubmitting || uploadingImage === 'front'}
                >
                  {uploadingImage === 'front' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                      <Text style={styles.uploadButtonText}>Ajouter une photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Pièce d'identité verso */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pièce d'identité - Verso (optionnel)</Text>
              <Text style={styles.sectionDescription}>
                Photo du verso de votre pièce d'identité
              </Text>
              {idDocumentBack && idDocumentBackUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: idDocumentBackUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => pickImage('back')}
                    disabled={isSubmitting || uploadingImage === 'back'}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                    <Text style={styles.changeButtonText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('back')}
                  disabled={isSubmitting || uploadingImage === 'back'}
                >
                  {uploadingImage === 'back' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                      <Text style={styles.uploadButtonText}>Ajouter une photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Selfie */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photo de vous (selfie) *</Text>
              <Text style={styles.sectionDescription}>
                Un selfie pour vérifier que vous êtes bien la personne sur le document (Face Match)
              </Text>
              {selfie && selfieUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selfieUri }} style={styles.previewImage} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => pickImage('selfie')}
                      disabled={isSubmitting || uploadingImage === 'selfie'}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                      <Text style={styles.changeButtonText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cameraButton}
                      onPress={takePicture}
                      disabled={isSubmitting || uploadingImage === 'selfie'}
                    >
                      <MaterialCommunityIcons name="camera" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.selfieActions}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage('selfie')}
                    disabled={isSubmitting || uploadingImage === 'selfie'}
                  >
                    {uploadingImage === 'selfie' ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} />
                        <Text style={styles.uploadButtonText}>Depuis la galerie</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.cameraButton]}
                    onPress={takePicture}
                    disabled={isSubmitting || uploadingImage === 'selfie'}
                  >
                    <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Prendre une photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.note}>
              * Champs obligatoires{'\n'}
              Vos documents seront traités de manière confidentielle et sécurisée.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || !idDocumentFront || !selfie}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  cameraButton: {
    backgroundColor: '#f9f9f9',
  },
  selfieActions: {
    flexDirection: 'row',
    gap: 12,
  },
  note: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


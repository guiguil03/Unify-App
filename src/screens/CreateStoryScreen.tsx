import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { StoriesService } from '../services/StoriesService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { supabase } from '../config/supabase';

export default function CreateStoryScreen() {
  const navigation = useNavigation();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
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

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadImage(asset.uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      showErrorToast('Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Créer un FormData pour l'upload
      const formData = new FormData();
      
      // Déterminer le type MIME
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      // Créer un nom de fichier unique
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Ajouter le fichier au FormData
      const file: any = {
        uri: uri,
        type: contentType,
        name: fileName,
      };
      
      // Lire le fichier comme ArrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('stories')
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: false,
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      setShowPreview(true);
      showSuccessToast('Image téléchargée ! 📸');
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      showErrorToast(error.message || 'Impossible de télécharger l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!imageUrl.trim()) {
      showErrorToast('Veuillez ajouter une image');
      return;
    }

    setIsCreating(true);
    try {
      await StoriesService.createStory({
        imageUrl: imageUrl.trim(),
        caption: caption.trim() || undefined,
      });

      showSuccessToast('Story ajoutée ! Visible pendant 24h 🎉');
      
      // Réinitialiser les champs
      setImageUrl('');
      setCaption('');
      setShowPreview(false);
      
      // Retour à l'écran précédent
      navigation.goBack();
    } catch (error: any) {
      console.error('Erreur lors de la création de la story:', error);
      showErrorToast(error?.message || 'Impossible de créer la story');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreview = () => {
    if (imageUrl.trim()) {
      setShowPreview(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une story</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prévisualisation de l'image */}
        {imageUrl.trim() && showPreview ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
              onError={() => {
                showErrorToast('Impossible de charger l\'image');
                setShowPreview(false);
              }}
            />
            {caption.trim() && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionPreview}>{caption}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.closePreview}
              onPress={() => setShowPreview(false)}
            >
              <MaterialCommunityIcons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Sélection de l'image */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="image" size={24} color="#E83D4D" />
            <Text style={styles.cardTitle}>Image de la story</Text>
          </View>

          {/* Bouton pour choisir depuis la galerie */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImage}
            disabled={isUploading || isCreating}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#E83D4D" />
            ) : (
              <>
                <MaterialCommunityIcons name="image-plus" size={24} color="#E83D4D" />
                <Text style={styles.galleryButtonText}>Choisir depuis la galerie</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* URL manuelle */}
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor="#999"
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isCreating && !isUploading}
          />

          <View style={styles.urlHints}>
            <Text style={styles.hint}>
              💡 Vous pouvez aussi coller une URL d'image
            </Text>
          </View>

          {imageUrl.trim() && (
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
            >
              <MaterialCommunityIcons name="eye" size={20} color="#E83D4D" />
              <Text style={styles.previewButtonText}>Aperçu de l'image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Légende */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="text" size={24} color="#E83D4D" />
            <Text style={styles.cardTitle}>Légende (optionnel)</Text>
          </View>

          <TextInput
            style={[styles.input, styles.captionInput]}
            placeholder="Ajoutez une légende à votre story..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            maxLength={150}
            textAlignVertical="top"
            editable={!isCreating}
          />
          <Text style={styles.charCount}>{caption.length} / 150</Text>
        </View>

        {/* Informations */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#666" />
            <Text style={styles.infoTitle}>À propos des stories</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Visible pendant 24 heures puis disparaît automatiquement
            </Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="eye-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Vous pouvez voir qui a vu votre story
            </Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Visible par tous vos contacts et coureurs
            </Text>
          </View>
        </View>

        {/* Idées de contenu */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Idées de stories</Text>
          
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Partagez votre course du matin
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Montrez votre nouveau record
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Votre parcours préféré
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Motivez la communauté !
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Boutons de bas de page */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <MaterialCommunityIcons name="close" size={20} color="#666" />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.publishButton,
            (!imageUrl.trim() || isCreating) && styles.publishButtonDisabled
          ]}
          onPress={handleCreate}
          disabled={isCreating || !imageUrl.trim()}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.publishButtonText}>Publier la story</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captionPreview: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  closePreview: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E83D4D',
    borderStyle: 'dashed',
    gap: 10,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E83D4D',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  captionInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  urlHints: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  hintService: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E83D4D',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E83D4D',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  bottomSpace: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#E83D4D',
    borderRadius: 12,
    gap: 8,
    shadowColor: '#E83D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  publishButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

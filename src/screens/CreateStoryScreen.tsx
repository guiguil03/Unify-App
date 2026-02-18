import React, { useState, useRef, useEffect } from 'react';
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
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { StoriesService } from '../services/StoriesService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { supabase } from '../config/supabase';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function CreateStoryScreen() {
  const navigation = useNavigation();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const previewScale = useRef(new Animated.Value(0.9)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animations en cascade pour les cartes
    Animated.stagger(100, [
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animation de la prévisualisation
  useEffect(() => {
    if (showPreview) {
      Animated.parallel([
        Animated.spring(previewScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(previewOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(previewScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(previewOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPreview]);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
      // Animation lors de l'upload réussi
      Animated.sequence([
        Animated.timing(previewOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setShowPreview(true);
      showSuccessToast('Image téléchargée ! 📸');
    } catch (error: any) {
      showErrorToast(error.message || 'Impossible de télécharger l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!imageUrl.trim()) {
      // Animation de shake pour indiquer l'erreur
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      showErrorToast('Veuillez ajouter une image');
      return;
    }

    animateButtonPress();
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une story</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Prévisualisation de l'image */}
        {imageUrl.trim() && showPreview ? (
          <Animated.View 
            style={[
              styles.previewContainer,
              {
                opacity: previewOpacity,
                transform: [{ scale: previewScale }],
              },
            ]}
          >
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
              <Animated.View 
                style={[
                  styles.captionOverlay,
                  {
                    opacity: previewOpacity,
                  },
                ]}
              >
                <Text style={styles.captionPreview}>{caption}</Text>
              </Animated.View>
            )}
            <TouchableOpacity
              style={styles.closePreview}
              onPress={() => setShowPreview(false)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* Sélection de l'image */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: card1Anim,
              transform: [
                {
                  translateY: card1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="image" size={24} color="#7D80F4" />
            </View>
            <Text style={styles.cardTitle}>Image de la story</Text>
          </View>

          {/* Bouton pour choisir depuis la galerie */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImage}
            disabled={isUploading || isCreating}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#7D80F4" />
            ) : (
              <>
                <MaterialCommunityIcons name="image-plus" size={24} color="#7D80F4" />
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
              <MaterialCommunityIcons name="eye" size={20} color="#7D80F4" />
              <Text style={styles.previewButtonText}>Aperçu de l'image</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Légende */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: card2Anim,
              transform: [
                {
                  translateY: card2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="text" size={24} color="#7D80F4" />
            </View>
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
          <Animated.Text 
            style={[
              styles.charCount,
              {
                color: caption.length > 140 ? '#ff4444' : '#999',
              },
            ]}
          >
            {caption.length} / 150
          </Animated.Text>
        </Animated.View>

        {/* Informations */}
        <Animated.View 
          style={[
            styles.infoCard,
            {
              opacity: card3Anim,
              transform: [
                {
                  translateY: card3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
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
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Boutons de bas de page */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={20} color={COLORS.textLight} />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.publishButton,
              (!imageUrl.trim() || isCreating) && styles.publishButtonDisabled
            ]}
            onPress={handleCreate}
            disabled={isCreating || !imageUrl.trim()}
            activeOpacity={0.8}
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
        </Animated.View>
      </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    width: 38,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  previewContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    height: width * 1.6, // Format story (9:16)
    maxHeight: 600,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  captionInput: {
    minHeight: 120,
    paddingTop: 16,
    lineHeight: 22,
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
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7D80F4',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 12,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    color: COLORS.text,
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
    color: COLORS.textLight,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

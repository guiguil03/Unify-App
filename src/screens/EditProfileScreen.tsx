import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ProfileService } from '../services/ProfileService';
import { ProfilePhotoService } from '../services/ProfilePhotoService';
import { useProfile } from '../hooks/useProfile';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { COLORS } from '../constants/colors';

const LEVELS = [
  { value: 'beginner', label: '🐣 Débutant(e)', description: 'Je commence la course' },
  { value: 'intermediate', label: '🏃 Intermédiaire', description: 'Je cours régulièrement' },
  { value: 'advanced', label: '💪 Avancé(e)', description: 'Je prépare des compétitions' },
  { value: 'expert', label: '🏆 Expert(e)', description: 'Je suis un(e) coureur(se) confirmé(e)' },
];

const TIMES = [
  { value: 'morning', label: '🌅 Matin', time: '6h - 10h' },
  { value: 'afternoon', label: '☀️ Après-midi', time: '14h - 18h' },
  { value: 'evening', label: '🌇 Soirée', time: '18h - 21h' },
  { value: 'night', label: '🌙 Nuit', time: '21h - 6h' },
];

const TERRAINS = [
  { value: 'route', label: 'Route', icon: 'road-variant' },
  { value: 'trail', label: 'Trail', icon: 'pine-tree' },
  { value: 'track', label: 'Piste', icon: 'stadium' },
  { value: 'mixed', label: 'Mixte', icon: 'tune-variant' },
];

const GROUP_PREFERENCES = [
  { value: 'solo', label: 'Solo', icon: 'account', description: 'Je préfère courir seul(e)' },
  { value: 'group', label: 'Groupe', icon: 'account-group', description: 'J\'aime courir en groupe' },
  { value: 'both', label: 'Les deux', icon: 'account-multiple', description: 'Ça dépend de mon humeur' },
];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, loading, refetch } = useProfile();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [preferredTerrain, setPreferredTerrain] = useState<string[]>([]);
  const [groupPreference, setGroupPreference] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Mettre à jour les champs quand le profil est chargé
  useEffect(() => {
    if (profile) {
      console.log('📥 Chargement des données du profil:', profile);
      setName(profile.name || '');
      setBio(profile.bio || '');
      setAvatar(profile.avatar || '');
      setAvatarPreview(profile.avatar || null);
      setLevel(profile.level || '');
      setGoal(profile.goal || '');
      setPreferredTime(profile.preferredTime || '');
      setPreferredTerrain(profile.preferredTerrain ? profile.preferredTerrain.split(',').filter(t => t.trim()) : []);
      setGroupPreference(profile.groupPreference || '');
    }
  }, [profile]);

  // Demander les permissions pour accéder à la galerie
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission pour accéder à la galerie refusée');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarPreview(imageUri);
        
        // Upload immédiatement la photo
        setIsUploadingPhoto(true);
        try {
          const publicUrl = await ProfilePhotoService.uploadProfilePhoto(imageUri);
          setAvatar(publicUrl);
          showSuccessToast('Photo de profil téléchargée !');
        } catch (error: any) {
          console.error('Erreur lors de l\'upload:', error);
          showErrorToast(error.message || 'Impossible de télécharger la photo');
          setAvatarPreview(null);
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      showErrorToast('Impossible de sélectionner l\'image');
    }
  };

  const removePhoto = async () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProfilePhotoService.deleteProfilePhoto();
              setAvatar('');
              setAvatarPreview(null);
              showSuccessToast('Photo de profil supprimée');
            } catch (error: any) {
              showErrorToast(error.message || 'Impossible de supprimer la photo');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    console.log('🔵 handleSave appelé');
    console.log('🔵 Nom:', name);
    console.log('🔵 isSaving:', isSaving);
    
    if (!name.trim()) {
      console.log('❌ Nom vide, affichage du toast');
      showErrorToast('Le nom est obligatoire');
      return;
    }

    console.log('✅ Nom valide, début de la sauvegarde');
    setIsSaving(true);
    try {
      const updateData: any = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
        level: level || undefined,
        goal: goal.trim() || undefined,
        preferredTime: preferredTime || undefined,
        preferredTerrain: preferredTerrain.length > 0 ? preferredTerrain.join(',') : undefined,
        groupPreference: groupPreference || undefined,
      };

      console.log('📤 Données à sauvegarder:', updateData);

      await ProfileService.updateProfile(updateData);
      
      console.log('✅ Sauvegarde réussie');
      
      // Rafraîchir le profil après la sauvegarde
      await refetch();
      
      showSuccessToast('Profil mis à jour !');
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      const errorMessage = error?.message || error?.error?.message || 'Impossible de sauvegarder le profil';
      showErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTerrain = (terrainValue: string) => {
    if (preferredTerrain.includes(terrainValue)) {
      setPreferredTerrain(preferredTerrain.filter(t => t !== terrainValue));
    } else {
      setPreferredTerrain([...preferredTerrain, terrainValue]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7D80F4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations de base */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations de base</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isSaving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo de profil</Text>
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreviewContainer}>
                {avatarPreview ? (
                  <Image source={{ uri: avatarPreview }} style={styles.avatarPreview} />
                ) : (
                  <View style={[styles.avatarPreview, styles.avatarPlaceholder]}>
                    <MaterialCommunityIcons name="account" size={40} color="#999" />
                  </View>
                )}
                {isUploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.avatarButtons}>
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={pickImage}
                  disabled={isSaving || isUploadingPhoto}
                >
                  <MaterialCommunityIcons name="camera" size={20} color="#7D80F4" />
                  <Text style={styles.avatarButtonText}>
                    {avatarPreview ? 'Changer' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
                {avatarPreview && (
                  <TouchableOpacity
                    style={[styles.avatarButton, styles.removeButton]}
                    onPress={removePhoto}
                    disabled={isSaving || isUploadingPhoto}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#ff4444" />
                    <Text style={[styles.avatarButtonText, styles.removeButtonText]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>À propos de moi</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Parlez-nous de vous..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
              editable={!isSaving}
            />
            <Text style={styles.charCount}>{bio.length} / 200</Text>
          </View>
        </View>

        {/* Niveau */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Niveau de course</Text>
          {LEVELS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.optionCard,
                level === item.value && styles.optionCardSelected,
              ]}
              onPress={() => setLevel(item.value)}
              disabled={isSaving}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  level === item.value && styles.optionLabelSelected,
                ]}>
                  {item.label}
                </Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
              {level === item.value && (
                <MaterialCommunityIcons name="check-circle" size={26} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Objectif */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mon objectif</Text>
          <TextInput
            style={[styles.input, styles.goalInput]}
            placeholder="Ex: Marathon en moins de 4h, Perdre du poids..."
            value={goal}
            onChangeText={setGoal}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={!isSaving}
          />
        </View>

        {/* Moment préféré */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Moment préféré pour courir</Text>
          <View style={styles.gridContainer}>
            {TIMES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.gridOption,
                  preferredTime === item.value && styles.gridOptionSelected,
                ]}
                onPress={() => setPreferredTime(item.value)}
                disabled={isSaving}
              >
                <Text style={[
                  styles.gridOptionLabel,
                  preferredTime === item.value && styles.gridOptionLabelSelected,
                ]}>
                  {item.label}
                </Text>
                <Text style={styles.gridOptionTime}>{item.time}</Text>
                {preferredTime === item.value && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Type de parcours */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Type de parcours</Text>
          <Text style={styles.subtitle}>Sélectionnez un ou plusieurs types</Text>
          <View style={styles.gridContainer}>
            {TERRAINS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.terrainOption,
                  preferredTerrain.includes(item.value) && styles.terrainOptionSelected,
                ]}
                onPress={() => toggleTerrain(item.value)}
                disabled={isSaving}
              >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={32}
                color={preferredTerrain.includes(item.value) ? COLORS.primary : COLORS.textLight}
              />
                <Text style={[
                  styles.terrainLabel,
                  preferredTerrain.includes(item.value) && styles.terrainLabelSelected,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Préférence de groupe */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Préférence de course</Text>
          {GROUP_PREFERENCES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.optionCard,
                groupPreference === item.value && styles.optionCardSelected,
              ]}
              onPress={() => setGroupPreference(item.value)}
              disabled={isSaving}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={26}
                color={groupPreference === item.value ? COLORS.primary : COLORS.textLight}
              />
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  groupPreference === item.value && styles.optionLabelSelected,
                ]}>
                  {item.label}
                </Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
              {groupPreference === item.value && (
                <MaterialCommunityIcons name="check-circle" size={26} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats non modifiables */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vos statistiques</Text>
          <Text style={styles.infoText}>
            Les statistiques sont calculées automatiquement à partir de vos activités
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile?.stats.totalDistance || 0}</Text>
              <Text style={styles.statLabel}>km parcourus</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile?.stats.sessions || 0}</Text>
              <Text style={styles.statLabel}>sessions</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Boutons de bas de page */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <MaterialCommunityIcons name="close" size={20} color="#666" />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (isSaving || !name.trim()) && styles.saveButtonDisabled
          ]}
          onPress={() => {
            console.log('🔵 Bouton Enregistrer pressé');
            console.log('🔵 name:', name);
            console.log('🔵 name.trim():', name.trim());
            console.log('🔵 name.trim().length:', name.trim().length);
            console.log('🔵 isSaving:', isSaving);
            console.log('🔵 disabled:', isSaving || !name.trim());
            if (!isSaving && name.trim()) {
              handleSave();
            } else {
              console.log('⚠️ Bouton désactivé - nom vide ou en cours de sauvegarde');
              if (!name.trim()) {
                showErrorToast('Le nom est obligatoire');
              }
            }
          }}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
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
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  required: {
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  goalInput: {
    minHeight: 70,
    paddingTop: 14,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '500',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    backgroundColor: '#F0F0FF',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridOption: {
    flex: 1,
    minWidth: '47%',
    padding: 18,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gridOptionSelected: {
    backgroundColor: '#F0F0FF',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gridOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  gridOptionLabelSelected: {
    color: COLORS.primary,
  },
  gridOptionTime: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  terrainOption: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  terrainOptionSelected: {
    backgroundColor: '#F0F0FF',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  terrainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
  },
  terrainLabelSelected: {
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 18,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSpace: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarPreviewContainer: {
    position: 'relative',
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flex: 1,
    gap: 10,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  removeButton: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  avatarButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  removeButtonText: {
    color: '#ff4444',
  },
});

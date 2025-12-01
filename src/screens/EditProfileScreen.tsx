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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ProfileService } from '../services/ProfileService';
import { useProfile } from '../hooks/useProfile';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { COLORS } from '../constants/colors';

const LEVELS = [
  { value: 'beginner', label: '🐣 Débutant', description: 'Je commence la course' },
  { value: 'intermediate', label: '🏃 Intermédiaire', description: 'Je cours régulièrement' },
  { value: 'advanced', label: '💪 Avancé', description: 'Je prépare des compétitions' },
  { value: 'expert', label: '🏆 Expert', description: 'Je suis un coureur confirmé' },
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
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [preferredTerrain, setPreferredTerrain] = useState<string[]>([]);
  const [groupPreference, setGroupPreference] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mettre à jour les champs quand le profil est chargé
  useEffect(() => {
    if (profile) {
      console.log('📥 Chargement des données du profil:', profile);
      setName(profile.name || '');
      setBio(profile.bio || '');
      setAvatar(profile.avatar || '');
      setLevel(profile.level || '');
      setGoal(profile.goal || '');
      setPreferredTime(profile.preferredTime || '');
      setPreferredTerrain(profile.preferredTerrain ? profile.preferredTerrain.split(',').filter(t => t.trim()) : []);
      setGroupPreference(profile.groupPreference || '');
    }
  }, [profile]);

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
      {/* Header fixe */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.headerSpacer} />
      </View>

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
            <TextInput
              style={styles.input}
              placeholder="https://example.com/photo.jpg"
              value={avatar}
              onChangeText={setAvatar}
              autoCapitalize="none"
              keyboardType="url"
              editable={!isSaving}
            />
            <Text style={styles.hint}>💡 URL de votre photo (Imgur, Gravatar...)</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingTop: 50,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
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
});

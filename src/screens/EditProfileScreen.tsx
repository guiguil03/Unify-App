import React, { useState } from 'react';
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
  const { profile, loading } = useProfile();
  
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [level, setLevel] = useState(profile?.level || '');
  const [goal, setGoal] = useState(profile?.goal || '');
  const [preferredTime, setPreferredTime] = useState(profile?.preferredTime || '');
  const [preferredTerrain, setPreferredTerrain] = useState<string[]>(
    profile?.preferredTerrain ? profile.preferredTerrain.split(',') : []
  );
  const [groupPreference, setGroupPreference] = useState(profile?.groupPreference || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showErrorToast('Le nom est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      await ProfileService.updateProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
        level: level || undefined,
        goal: goal.trim() || undefined,
        preferredTime: preferredTime || undefined,
        preferredTerrain: preferredTerrain.length > 0 ? preferredTerrain.join(',') : undefined,
        groupPreference: groupPreference || undefined,
      });
      
      showSuccessToast('Profil mis à jour !');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showErrorToast('Impossible de sauvegarder le profil');
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
        <ActivityIndicator size="large" color="#E83D4D" />
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
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
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
                <MaterialCommunityIcons name="check-circle" size={24} color="#E83D4D" />
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
                  size={28}
                  color={preferredTerrain.includes(item.value) ? '#E83D4D' : '#666'}
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
                size={24}
                color={groupPreference === item.value ? '#E83D4D' : '#666'}
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
                <MaterialCommunityIcons name="check-circle" size={24} color="#E83D4D" />
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
            isSaving && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={isSaving || !name.trim()}
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#E83D4D',
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
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E83D4D',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#E83D4D',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridOption: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gridOptionSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E83D4D',
  },
  gridOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gridOptionLabelSelected: {
    color: '#E83D4D',
  },
  gridOptionTime: {
    fontSize: 13,
    color: '#666',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E83D4D',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  terrainOption: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  terrainOptionSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E83D4D',
  },
  terrainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  terrainLabelSelected: {
    color: '#E83D4D',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E83D4D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
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
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS } from '../constants/colors';
import { ProfileService } from '../services/ProfileService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';

const drapeau = require('../assets/drapeau.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const TRAITS = [
  { id: 'bavard', label: 'Bavard(e)', icon: 'message-text' },
  { id: 'drole', label: 'Drôle', icon: 'emoticon-happy' },
  { id: 'sportif', label: 'Sportif(ve)', icon: 'run' },
  { id: 'silencieux', label: 'Silencieux(se)', icon: 'message-text-outline' },
  { id: 'serieux', label: 'Sérieux', icon: 'target' },
  { id: 'bienveillant', label: 'Bienveillant', icon: 'flower' },
  { id: 'endurant', label: 'Endurant', icon: 'arm-flex' },
  { id: 'pose', label: 'Posé', icon: 'sunglasses' },
  { id: 'passionne', label: 'Passionné', icon: 'star' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function OnboardingScreen({ route }: Props) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Données du formulaire
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [birthDate, setBirthDate] = useState<Date>(new Date(2000, 0, 1));
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [pseudo, setPseudo] = useState('');
  
  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Scroll automatique vers la valeur sélectionnée pour la date
  useEffect(() => {
    if (currentStep === 2) {
      const days = Array.from({ length: 31 }, (_, i) => i + 1);
      const years = Array.from({ length: 75 }, (_, i) => 1950 + i).reverse();
      const selectedDayIndex = birthDate.getDate() - 1;
      const selectedMonthIndex = birthDate.getMonth();
      const selectedYearIndex = years.findIndex(y => y === birthDate.getFullYear());
      
      setTimeout(() => {
        dayScrollRef.current?.scrollTo({ y: selectedDayIndex * 72, animated: true });
        monthScrollRef.current?.scrollTo({ y: selectedMonthIndex * 72, animated: true });
        yearScrollRef.current?.scrollTo({ y: selectedYearIndex * 72, animated: true });
      }, 300);
    }
  }, [currentStep, birthDate]);

  const toggleTrait = (traitId: string) => {
    if (selectedTraits.includes(traitId)) {
      setSelectedTraits(selectedTraits.filter(id => id !== traitId));
    } else {
      setSelectedTraits([...selectedTraits, traitId]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleFinish = async () => {
    if (!gender) {
      showErrorToast('Veuillez sélectionner votre genre');
      setCurrentStep(1);
      return;
    }

    // Validation de la date de naissance
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const realAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (realAge < 18) {
      showErrorToast('Vous devez avoir au moins 18 ans pour utiliser Unify');
      setCurrentStep(2);
      return;
    }

    if (realAge > 120 || birthDate > now) {
      showErrorToast('Veuillez entrer une date de naissance valide');
      setCurrentStep(2);
      return;
    }

    // Validation du pseudo
    const trimmedPseudo = pseudo.trim();
    if (!trimmedPseudo) {
      showErrorToast('Veuillez entrer un pseudo');
      setCurrentStep(4);
      return;
    }

    if (trimmedPseudo.length < 2) {
      showErrorToast('Le pseudo doit contenir au moins 2 caractères');
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    try {
      await ProfileService.updateProfile({
        name: trimmedPseudo,
        gender: gender,
        birthDate: birthDate.toISOString().split('T')[0],
        traits: selectedTraits.join(','),
      });

      showSuccessToast('Profil créé avec succès !');
      navigation.navigate('Home' as never);
    } catch {
      showErrorToast('Erreur lors de la sauvegarde du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return gender !== null;
      case 2: return true;
      case 3: return selectedTraits.length > 0;
      case 4: return pseudo.trim().length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.mainTitle}>Avant de commencer...</Text>
            <Text style={styles.mainText}>Dites en plus sur vous !</Text>
            <View style={styles.illustrationContainer}>
              <MaterialCommunityIcons name="account-question" size={120} color={COLORS.primary} />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Sélectionnez</Text>
            <Text style={styles.mainText}>Votre genre</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                onPress={() => setGender('male')}
              >
                <MaterialCommunityIcons name="gender-male" size={70} color={gender === 'male' ? COLORS.background : COLORS.primary} />
                <Text style={[styles.genderLabel, gender === 'male' && styles.genderLabelSelected]}>Homme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                onPress={() => setGender('female')}
              >
                <MaterialCommunityIcons name="gender-female" size={70} color={gender === 'female' ? COLORS.background : COLORS.primary} />
                <Text style={[styles.genderLabel, gender === 'female' && styles.genderLabelSelected]}>Femme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'other' && styles.genderButtonSelected]}
                onPress={() => setGender('other')}
              >
                <MaterialCommunityIcons name="account" size={70} color={gender === 'other' ? COLORS.background : COLORS.primary} />
                <Text style={[styles.genderLabel, gender === 'other' && styles.genderLabelSelected]}>Non-genré</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.warningText}>Vous ne pourrez pas revenir en arrière</Text>
          </View>
        );

      case 2:
        const days = Array.from({ length: 31 }, (_, i) => i + 1);
        const years = Array.from({ length: 75 }, (_, i) => 1950 + i).reverse();
        
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Quel est votre Date</Text>
            <Text style={styles.mainText}>De naissance ?</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateFieldContainer}>
                <ScrollView 
                  ref={dayScrollRef}
                  style={styles.dateScrollView} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dateField,
                        birthDate.getDate() === day && styles.dateFieldSelected
                      ]}
                      onPress={() => setBirthDate(new Date(birthDate.getFullYear(), birthDate.getMonth(), day))}
                    >
                      <Text style={[
                        styles.dateFieldText,
                        birthDate.getDate() === day && styles.dateFieldTextSelected
                      ]}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateFieldContainer}>
                <ScrollView 
                  ref={monthScrollRef}
                  style={styles.dateScrollView} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateField,
                        birthDate.getMonth() === index && styles.dateFieldSelected
                      ]}
                      onPress={() => setBirthDate(new Date(birthDate.getFullYear(), index, birthDate.getDate()))}
                    >
                      <Text style={[
                        styles.dateFieldText,
                        birthDate.getMonth() === index && styles.dateFieldTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateFieldContainer}>
                <ScrollView 
                  ref={yearScrollRef}
                  style={styles.dateScrollView} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.dateField,
                        birthDate.getFullYear() === year && styles.dateFieldSelected
                      ]}
                      onPress={() => setBirthDate(new Date(year, birthDate.getMonth(), birthDate.getDate()))}
                    >
                      <Text style={[
                        styles.dateFieldText,
                        birthDate.getFullYear() === year && styles.dateFieldTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Comment vous</Text>
            <Text style={styles.mainText}>Décrivez-vous ?</Text>
            <View style={styles.traitsGrid}>
              {TRAITS.map((trait) => (
                <TouchableOpacity
                  key={trait.id}
                  style={[
                    styles.traitButton,
                    selectedTraits.includes(trait.id) && styles.traitButtonSelected
                  ]}
                  onPress={() => toggleTrait(trait.id)}
                >
                  <MaterialCommunityIcons
                    name={trait.icon as any}
                    size={36}
                    color={selectedTraits.includes(trait.id) ? COLORS.background : COLORS.primary}
                  />
                  <Text style={[
                    styles.traitLabel,
                    selectedTraits.includes(trait.id) && styles.traitLabelSelected
                  ]}>
                    {trait.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Comment doit-on</Text>
            <Text style={styles.mainText}>Vous appeler ?</Text>
            <TextInput
              style={styles.pseudoInput}
              placeholder="Votre Pseudo"
              placeholderTextColor={COLORS.textLight}
              value={pseudo}
              onChangeText={setPseudo}
              autoCapitalize="words"
              maxLength={30}
            />
            <View style={styles.illustrationContainer}>
              <MaterialCommunityIcons name="account-circle" size={100} color={COLORS.primary} />
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tout est prêt !</Text>
            <Text style={styles.mainText}>On va courir ?</Text>
            <View style={styles.illustrationContainer}>
              <MaterialCommunityIcons name="run-fast" size={120} color={COLORS.primary} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec barre de progression */}
      <View style={styles.header}>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {currentStep > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Image source={drapeau} style={styles.flagIcon} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Contenu */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Footer avec bouton */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps - 1 ? "C'est parti !" : currentStep === 0 ? "Commencer" : "Suivant"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  backButton: {
    marginBottom: 12,
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  flagIcon: {
    width: 42,
    height: 51,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.background,
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  genderLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  genderLabelSelected: {
    color: COLORS.background,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    width: '100%',
  },
  dateFieldContainer: {
    flex: 1,
    height: 180,
  },
  dateScrollView: {
    flex: 1,
  },
  dateScrollContent: {
    paddingVertical: 80,
  },
  dateField: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  dateFieldSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateFieldText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateFieldTextSelected: {
    color: COLORS.background,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 32,
    justifyContent: 'center',
    width: '100%',
  },
  traitButton: {
    width: '30%',
    backgroundColor: COLORS.background,
    borderRadius: 50,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    aspectRatio: 1,
  },
  traitButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  traitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  traitLabelSelected: {
    color: COLORS.background,
  },
  pseudoInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
  },
  illustrationContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
});


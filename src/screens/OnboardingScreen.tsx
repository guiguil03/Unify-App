import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS } from '../constants/colors';
import { ProfileService } from '../services/ProfileService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { isPseudoClean } from '../utils/profanityFilter';

const drapeau = require('../assets/drapeau.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const TRAITS = [
  { id: 'bavard', label: 'Bavard(e)', icon: 'message-text' },
  { id: 'drole', label: 'Drôle', icon: 'emoticon-happy' },
  { id: 'sportif', label: 'Sportif(ve)', icon: 'run' },
  { id: 'silencieux', label: 'Silencieux', icon: 'message-text-outline' },
  { id: 'serieux', label: 'Sérieux', icon: 'target' },
  { id: 'bienveillant', label: 'Bienveillant', icon: 'flower' },
  { id: 'endurant', label: 'Endurant', icon: 'arm-flex' },
  { id: 'pose', label: 'Posé', icon: 'sunglasses' },
  { id: 'passionne', label: 'Passionné', icon: 'star' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 75 }, (_, i) => 1950 + i).reverse();

// ─────────────────────────────────────────────
// Drum-roll wheel picker
// ─────────────────────────────────────────────
const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  data: (string | number)[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
  renderLabel?: (value: string | number) => string;
  flex?: number;
}

function WheelPicker({ data, selectedValue, onChange, renderLabel, flex = 1 }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(Math.max(0, data.indexOf(selectedValue)));
  const [activeIndex, setActiveIndex] = useState(currentIndexRef.current);

  useEffect(() => {
    const idx = Math.max(0, data.indexOf(selectedValue));
    currentIndexRef.current = idx;
    setActiveIndex(idx);
    // Small delay so the scroll view is mounted
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
    }, 50);
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, data.length - 1));
    if (clamped !== currentIndexRef.current) {
      currentIndexRef.current = clamped;
      setActiveIndex(clamped);
    }
  }, [data]);

  const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, data.length - 1));
    currentIndexRef.current = clamped;
    setActiveIndex(clamped);
    onChange(data[clamped]);
  }, [data, onChange]);

  return (
    <View style={[wheelStyles.container, { flex }]}>
      {/* Selection band */}
      <View style={wheelStyles.selectionBand} pointerEvents="none" />

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(245,245,245,1)', 'rgba(245,245,245,0)']}
        style={wheelStyles.fadeTop}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {data.map((item, index) => {
          const dist = Math.abs(index - activeIndex);
          const isSelected = dist === 0;
          const opacity = isSelected ? 1 : dist === 1 ? 0.45 : 0.2;
          const fontSize = isSelected ? 20 : dist === 1 ? 17 : 15;
          const fontWeight: '700' | '400' = isSelected ? '700' : '400';
          const color = isSelected ? COLORS.primary : COLORS.text;

          return (
            <View key={String(item)} style={wheelStyles.item}>
              <Text style={{ fontSize, fontWeight, color, opacity }}>
                {renderLabel ? renderLabel(item) : String(item).padStart(2, '0')}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(245,245,245,0)', 'rgba(245,245,245,1)']}
        style={wheelStyles.fadeBottom}
        pointerEvents="none"
      />
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBand: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    left: 4,
    right: 4,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.primary,
    zIndex: 2,
    borderRadius: 2,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
});

// ─────────────────────────────────────────────
// Onboarding screen
// ─────────────────────────────────────────────
export default function OnboardingScreen({ route }: Props) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [birthDay, setBirthDay] = useState(1);
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthYear, setBirthYear] = useState(2000);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [pseudo, setPseudo] = useState('');

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const getBirthDate = () => new Date(birthYear, birthMonth, birthDay);

  const toggleTrait = (traitId: string) => {
    setSelectedTraits(prev =>
      prev.includes(traitId) ? prev.filter(id => id !== traitId) : [...prev, traitId]
    );
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

    const birthDate = getBirthDate();
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

    if (!isPseudoClean(trimmedPseudo)) {
      showErrorToast('Ce pseudo contient des termes inappropriés');
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    try {
      await ProfileService.updateProfile({
        name: trimmedPseudo,
        gender,
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
              <MaterialCommunityIcons name="account-question" size={100} color={COLORS.primary} />
            </View>
            <View style={styles.previewCards}>
              {[
                { icon: 'gender-male-female', label: 'Votre genre', desc: 'Pour personnaliser votre expérience' },
                { icon: 'cake-variant', label: 'Votre date de naissance', desc: 'Réservé aux 18 ans et plus' },
                { icon: 'star-circle', label: 'Votre personnalité', desc: 'Pour trouver des partenaires compatibles' },
                { icon: 'at', label: 'Votre pseudo', desc: 'Comment vous serez affiché sur l\'app' },
              ].map((item, i) => (
                <View key={i} style={styles.previewCard}>
                  <View style={styles.previewCardIcon}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.previewCardText}>
                    <Text style={styles.previewCardLabel}>{item.label}</Text>
                    <Text style={styles.previewCardDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
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
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Quelle est votre</Text>
            <Text style={styles.mainText}>Date de naissance ?</Text>

            {/* Valeur affichée */}
            <Text style={styles.dateDisplay}>
              {`${String(birthDay).padStart(2, '0')} ${MONTHS[birthMonth]} ${birthYear}`}
            </Text>

            {/* Labels colonnes */}
            <View style={styles.dateLabels}>
              <Text style={[styles.dateLabel, { flex: 1 }]}>Jour</Text>
              <Text style={[styles.dateLabel, { flex: 2 }]}>Mois</Text>
              <Text style={[styles.dateLabel, { flex: 1.3 }]}>Année</Text>
            </View>

            {/* Pickers */}
            <View style={styles.datePickerRow}>
              <WheelPicker
                data={DAYS}
                selectedValue={birthDay}
                onChange={v => setBirthDay(v as number)}
                flex={1}
              />
              <WheelPicker
                data={MONTHS}
                selectedValue={MONTHS[birthMonth]}
                onChange={v => setBirthMonth(MONTHS.indexOf(v as string))}
                renderLabel={v => String(v)}
                flex={2}
              />
              <WheelPicker
                data={YEARS}
                selectedValue={birthYear}
                onChange={v => setBirthYear(v as number)}
                renderLabel={v => String(v)}
                flex={1.3}
              />
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
                  style={[styles.traitButton, selectedTraits.includes(trait.id) && styles.traitButtonSelected]}
                  onPress={() => toggleTrait(trait.id)}
                >
                  <MaterialCommunityIcons
                    name={trait.icon as any}
                    size={36}
                    color={selectedTraits.includes(trait.id) ? COLORS.background : COLORS.primary}
                  />
                  <Text
                    style={[styles.traitLabel, selectedTraits.includes(trait.id) && styles.traitLabelSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
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
      {/* Header */}
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

      {/* Footer */}
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
  // Gender
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
  // Date picker
  dateDisplay: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  dateLabels: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  dateLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  datePickerRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
  },
  // Traits
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
  // Pseudo
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
  // Footer
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
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  // Step 0 preview cards
  previewCards: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  previewCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardText: {
    flex: 1,
  },
  previewCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewCardDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

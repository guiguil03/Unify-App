import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useNavigationContainerRef } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigation = useNavigation<NavigationProp>();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const user = await getCurrentUserFromDB();
        if (user) {
          // Si l'utilisateur n'a pas de genre défini, il doit compléter l'onboarding
          if (!user.gender && !hasNavigated.current) {
            setNeedsOnboarding(true);
            // Attendre que la navigation soit prête
            setTimeout(() => {
              try {
                if (navigation.isReady()) {
                  navigation.navigate('Onboarding');
                  hasNavigated.current = true;
                }
              } catch (error) {
                if (__DEV__) console.error('Onboarding navigation failed:', error);
              }
            }, 100);
          } else {
            setNeedsOnboarding(false);
          }
        }
      } catch (error) {
        if (__DEV__) console.error('Onboarding check failed:', error);
      } finally {
        setIsChecking(false);
      }
    }

    // Attendre un peu pour que le navigator soit monté
    const timer = setTimeout(() => {
      checkOnboardingStatus();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7D80F4" />
      </View>
    );
  }

  if (needsOnboarding) {
    return null; // La navigation vers Onboarding est gérée par useEffect
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});


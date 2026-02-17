import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function OnboardingChecker() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    let mounted = true;

    async function checkOnboarding() {
      try {
        // Vérifier plusieurs fois si la navigation est prête
        const checkReady = () => {
          try {
            return (navigation as any).isReady?.() ?? true;
          } catch {
            return false;
          }
        };

        // Attendre que la navigation soit prête (max 3 secondes)
        let attempts = 0;
        const maxAttempts = 30;
        
        const waitForReady = () => {
          if (attempts >= maxAttempts || !mounted) {
            return;
          }
          
          if (checkReady()) {
            // Navigation est prête, vérifier l'onboarding
            getCurrentUserFromDB().then((user) => {
              if (mounted && user && !user.gender) {
                try {
                  navigation.navigate('Onboarding');
                } catch (error) {
                  if (__DEV__) console.error('Onboarding navigation failed:', error);
                }
              }
            }).catch((error: unknown) => {
              if (__DEV__) console.error('Onboarding user check failed:', error);
            });
          } else {
            attempts++;
            setTimeout(waitForReady, 100);
          }
        };

        waitForReady();
      } catch (error) {
        if (__DEV__) console.error('Onboarding check failed:', error);
      }
    }

    // Démarrer la vérification après un court délai
    const timer = setTimeout(checkOnboarding, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);

  return null;
}


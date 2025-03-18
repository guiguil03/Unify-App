import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebase';

// Import du logo
const logo = require('../assets/logo.png');

// Images pour l'écran d'accueil
const runningImg = require('../assets/running.png');

// Logs pour vérifier l'état de Firebase
console.log('Firebase Auth Status:', auth ? 'Initialized' : 'Not Initialized');
console.log('Current Auth Methods:', auth?.config?.apiKey ? 'Config OK' : 'No Config');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Animation pour l'écran d'accueil
  const fadeAnim = new Animated.Value(1);
  
  const { signIn, signUp, skipAuth } = useAuth();

  // Afficher l'écran d'accueil pendant 2.5 secondes
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        // Animation de transition
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowWelcome(false);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Fonction pour obtenir un message d'erreur Firebase convivial
  const getFirebaseErrorMessage = (error: any): string => {
    console.log('Type d\'erreur:', error?.constructor?.name);
    console.log('Code d\'erreur:', error?.code);
    console.log('Message d\'erreur:', error?.message);
    
    if (!(error instanceof FirebaseError)) {
      return `Une erreur s'est produite: ${error?.message || 'Erreur inconnue'}. Veuillez réessayer.`;
    }

    switch (error.code) {
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
      case 'auth/network-request-failed':
        return 'Problème de connexion réseau. Vérifiez votre connexion Internet.';
      case 'auth/operation-not-allowed':
        return 'Opération non autorisée. Vérifiez que l\'authentification par email/mot de passe est activée dans Firebase.';
      case 'auth/popup-blocked':  
        return 'La popup d\'authentification a été bloquée par le navigateur.';
      case 'auth/popup-closed-by-user':
        return 'La popup d\'authentification a été fermée avant la fin du processus.';
      case 'auth/internal-error':
        return 'Erreur interne Firebase. Veuillez réessayer plus tard.';
      default:
        return `Erreur: ${error.code} - ${error.message}`;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validation basique des champs
    if (isLoginMode && (!email || !password)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (!isLoginMode && (!name || !email || !password)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    
    console.log(`Tentative de ${isLoginMode ? 'connexion' : 'création de compte'} pour ${email}`);
    
    setIsSubmitting(true);
    try {
      console.log('Firebase Auth dans handleSubmit:', auth ? 'OK' : 'Non initialisé');
      
      if (isLoginMode) {
        console.log('Appel de signIn avec:', email);
        await signIn(email, password);
        console.log('Connexion réussie');
      } else {
        console.log('Appel de signUp avec:', name, email);
        await signUp(name, email, password);
        console.log('Inscription réussie');
      }
      // La navigation se fera automatiquement grâce au contexte d'authentification
    } catch (error) {
      console.error('Erreur complète:', error);
      
      const errorMessage = getFirebaseErrorMessage(error);
      Alert.alert(
        'Erreur',
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Réinitialiser les champs lors du changement de mode
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSkip = () => {
    // La transition vers la page d'accueil se fera automatiquement 
    // une fois que isSkipped est mis à true
    skipAuth();
  };

  // Écran d'accueil avec animation
  if (showWelcome) {
    return (
      <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#FF6B6B', '#E83D4D', '#B92B38']}
          style={styles.gradientBackground}
        >
          <Image source={logo} style={styles.welcomeLogo} />
          <Text style={styles.welcomeTitle}>Unify</Text>
          <Text style={styles.welcomeSlogan}>Courez ensemble, dépassez vos limites</Text>
          
          <Image source={runningImg} style={styles.welcomeImage} />
          
          <ActivityIndicator size="large" color="#fff" style={styles.welcomeLoader} />
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F8F8', '#F2F2F2']}
        style={styles.gradientContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName}>Unify</Text>
            <Text style={styles.appSlogan}>
              Courez ensemble, créez des liens
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>
              {isLoginMode ? 'Connexion' : 'Créer un compte'}
            </Text>

            {!isLoginMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLoginMode ? 'Se connecter' : 'S\'inscrire'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLoginMode
                  ? 'Pas encore de compte ? Créer un compte'
                  : 'Déjà un compte ? Se connecter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Continuer sans compte</Text>
            </TouchableOpacity>
            
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Découvrez avec Unify</Text>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Trouvez des coureurs près de chez vous</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Participez à des événements sportifs</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Suivez vos performances et votre progression</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#E83D4D',
  },
  appSlogan: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#E83D4D',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#E83D4D',
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
  features: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E83D4D',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  // Styles pour l'écran d'accueil
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeLogo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  welcomeSlogan: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  welcomeImage: {
    width: width * 0.8,
    height: height * 0.3,
    resizeMode: 'contain',
  },
  welcomeLoader: {
    marginTop: 40,
  },
});

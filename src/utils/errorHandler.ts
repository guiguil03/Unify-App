import Toast from 'react-native-toast-message';
import { FirebaseError } from 'firebase/app';

/**
 * Traduit les codes d'erreur Firebase en messages utilisateur compréhensibles
 * et affiche un toast avec le message approprié
 */
export const handleFirebaseError = (error: any, customMessage?: string): string => {
  // Limiter les logs pour réduire le bruit dans la console
  if (process.env.NODE_ENV === 'development') {
    // En développement uniquement, logger le code d'erreur mais pas tout le message 
    console.log('Code d\'erreur Firebase:', error?.code || 'Erreur sans code');
  }
  
  let message = customMessage || 'Une erreur s\'est produite';
  let type: 'success' | 'error' | 'info' = 'error';
  
  if (error instanceof FirebaseError) {
    switch (error.code) {
      // Erreurs d'authentification
      case 'auth/invalid-email':
        message = 'Adresse email invalide.';
        break;
      case 'auth/user-disabled':
        message = 'Ce compte a été désactivé.';
        break;
      case 'auth/user-not-found':
        message = 'Utilisateur non trouvé.';
        break;
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect.';
        break;
      case 'auth/invalid-credential':
        message = 'Identifiants invalides. Vérifiez votre email et mot de passe.';
        break;
      case 'auth/email-already-in-use':
        message = 'Cette adresse email est déjà utilisée.';
        break;
      case 'auth/weak-password':
        message = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Veuillez réessayer plus tard.';
        break;
      case 'auth/network-request-failed':
        message = 'Problème de connexion réseau. Vérifiez votre connexion Internet.';
        break;
      case 'auth/operation-not-allowed':
        message = 'Cette opération n\'est pas autorisée.';
        break;
      
      // Erreurs Firestore
      case 'permission-denied':
        message = 'Accès refusé. Vous n\'avez pas les droits nécessaires.';
        break;
      
      // Erreurs génériques
      default:
        message = `Erreur: ${error.message}`;
        break;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  // Afficher le toast
  Toast.show({
    type,
    text1: 'Erreur',
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
  });
  
  return message;
};

/**
 * Affiche un toast de succès
 */
export const showSuccessToast = (message: string, title: string = 'Succès') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
  });
};

/**
 * Affiche un toast d'information
 */
export const showInfoToast = (message: string, title: string = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
  });
};

/**
 * Affiche un toast d'erreur
 */
export const showErrorToast = (message: string, title: string = 'Erreur') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
  });
}; 
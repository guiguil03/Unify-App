import Toast from 'react-native-toast-message';

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
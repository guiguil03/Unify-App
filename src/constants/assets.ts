// Asset imports for React Native core components
import { Image } from 'react-native';

// Pre-load core React Native assets
export const preloadAssets = async () => {
  const images = [
    require('react-native/Libraries/LogBox/UI/LogBoxImages/close.png'),
    // Add other core RN assets here as needed
  ];

  // Preload all images
  await Promise.all(images.map(image => Image.prefetch(image)));
};

// Export asset references for use in components
export const CORE_ASSETS = {
  close: require('react-native/Libraries/LogBox/UI/LogBoxImages/close.png'),
};
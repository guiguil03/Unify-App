import { Asset } from 'expo-asset';
import { Image } from 'react-native';

export class AssetLoader {
  static async initializeAssets(): Promise<boolean> {
    try {
      const images = [
        require('../assets/icon.png'),
        require('../assets/splash.png'),
        require('../assets/adaptive-icon.png')
      ];

      const loadPromises = images.map(async (image) => {
        if (typeof image === 'string') {
          return Image.prefetch(image);
        }
        return Asset.fromModule(image).downloadAsync();
      });

      await Promise.all(loadPromises);
      return true;
    } catch (error) {
      console.error('Failed to load assets:', error);
      return false;
    }
  }
}
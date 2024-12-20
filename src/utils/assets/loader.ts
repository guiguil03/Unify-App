import { Image } from 'react-native';
import { APP_ASSETS, CORE_ASSETS } from './constants';
import { AssetLoader, AssetMap } from './types';

class AppAssetLoader implements AssetLoader {
  private loadedAssets: AssetMap = {};

  async loadAssets(): Promise<boolean> {
    try {
      // Préchargement des assets de l'application
      const appAssetPromises = Object.entries(APP_ASSETS).map(([key, asset]) => {
        return Image.prefetch(Image.resolveAssetSource(asset).uri)
          .then(() => {
            this.loadedAssets[key] = asset;
            return true;
          });
      });

      // Préchargement des assets du core
      const coreAssetPromises = Object.entries(CORE_ASSETS).map(([key, asset]) => {
        return Image.prefetch(Image.resolveAssetSource(asset).uri)
          .then(() => {
            this.loadedAssets[key] = asset;
            return true;
          });
      });

      await Promise.all([...appAssetPromises, ...coreAssetPromises]);
      return true;
    } catch (error) {
      console.error('Error loading assets:', error);
      return false;
    }
  }

  getAsset(key: string): number | undefined {
    return this.loadedAssets[key];
  }
}

export const assetLoader = new AppAssetLoader();
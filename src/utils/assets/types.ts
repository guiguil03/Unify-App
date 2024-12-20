export interface AssetMap {
  [key: string]: number;
}

export interface AssetLoader {
  loadAssets(): Promise<boolean>;
  getAsset(key: string): number | undefined;
}
import Constants from 'expo-constants';

/**
 * Récupère une variable d'environnement
 * Cherche dans Constants.expoConfig?.extra puis dans process.env
 * @param key - Clé de la variable d'environnement
 * @param defaultValue - Valeur par défaut si la variable n'est pas trouvée
 * @returns La valeur de la variable d'environnement
 */
export function getEnv(key: string, defaultValue?: string): string {
  // Essayer d'abord dans expoConfig.extra (pour Expo)
  const expoExtra = Constants.expoConfig?.extra;
  if (expoExtra && typeof expoExtra === 'object' && key in expoExtra) {
    const value = expoExtra[key as keyof typeof expoExtra];
    if (typeof value === 'string' && value) {
      return value;
    }
  }

  // Ensuite dans process.env (pour le développement)
  if (process.env[key]) {
    return process.env[key] as string;
  }

  // Si aucune valeur n'est trouvée et qu'une valeur par défaut est fournie
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  // Sinon, lancer une erreur
  throw new Error(
    `Variable d'environnement manquante: ${key}. Assurez-vous qu'elle est définie dans app.json (expo.extra) ou dans .env`
  );
}

/**
 * Récupère une variable d'environnement de manière optionnelle
 * @param key - Clé de la variable d'environnement
 * @returns La valeur de la variable ou undefined
 */
export function getEnvOptional(key: string): string | undefined {
  try {
    return getEnv(key);
  } catch {
    return undefined;
  }
}

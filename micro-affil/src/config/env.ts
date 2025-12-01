// Configuration de l'environnement

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
};

export function validateConfig(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Variable d'environnement manquante : ${key}`);
    }
  }
}

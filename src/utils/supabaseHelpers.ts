import { supabase } from '../config/supabase';

/**
 * Obtient l'utilisateur actuellement authentifié
 * @returns L'ID de l'utilisateur authentifié ou null
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Obtient l'utilisateur depuis la table users en utilisant auth_user_id
 * @returns L'utilisateur ou null
 */
export async function getCurrentUserFromDB(): Promise<any | null> {
  try {
    if (!supabase?.auth) {
      return null;
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      // Pas de session = pas connecté, c'est normal
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Anonymous',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          return null;
        }

        return newUser;
      }

      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une heure pour l'affichage
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

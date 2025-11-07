import { supabase } from '../config/supabase';

/**
 * Obtient l'utilisateur actuellement authentifié
 * @returns L'ID de l'utilisateur authentifié ou null
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Obtient l'utilisateur depuis la table users en utilisant auth_user_id
 * @returns L'utilisateur ou null
 */
export async function getCurrentUserFromDB(): Promise<any | null> {
  try {
    // Vérifier que supabase est bien initialisé
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client non initialisé');
      return null;
    }

    // Récupérer l'utilisateur authentifié
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur Supabase Auth:', authError);
      return null;
    }

    if (!authUser) {
      console.log('⚠️ Aucun utilisateur authentifié trouvé');
      return null;
    }

    console.log('✅ Utilisateur Supabase Auth trouvé:', authUser.id);

    // Chercher l'utilisateur dans la table users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (error) {
      // Si l'utilisateur n'existe pas dans la table users, le créer
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log('ℹ️ Utilisateur non trouvé dans la table users, création...');
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
          console.error('❌ Erreur lors de la création de l\'utilisateur dans la DB:', createError);
          return null;
        }

        console.log('✅ Utilisateur créé dans la table users:', newUser.id);
        return newUser;
      }

      console.error('❌ Erreur lors de la récupération de l\'utilisateur depuis la DB:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('❌ Erreur inattendue lors de la récupération de l\'utilisateur:', error);
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


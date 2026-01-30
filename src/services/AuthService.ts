// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { supabase } from '../config/supabase';
import { showSuccessToast } from '../utils/errorHandler';
import { getEnv } from '../utils/env';

export class AuthService {
  private static readonly USER_STORAGE_KEY = 'unify_user';
  private static readonly TOKEN_STORAGE_KEY = 'unify_token';

  static async login(email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative de connexion avec email: ${email}`);
      
      // Vérifier que supabase est bien initialisé
      if (!supabase) {
        console.error('❌ Erreur: supabase est undefined');
        throw new Error('Le client Supabase n\'est pas initialisé');
      }

      if (!supabase.auth) {
        console.error('❌ Erreur: supabase.auth est undefined');
        console.error('❌ Type de supabase:', typeof supabase);
        console.error('❌ Propriétés de supabase:', Object.keys(supabase || {}));
        throw new Error('La propriété auth du client Supabase n\'existe pas');
      }

      console.log('✅ Supabase client et auth sont disponibles');
      
      // Connexion avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erreur de connexion Supabase:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Aucun utilisateur retourné après la connexion');
      }

      console.log(`Connexion Supabase réussie pour l'utilisateur: ${data.user.id}`);
      
      // Récupérer ou créer les données utilisateur dans la table users
      const user = await this.getOrCreateUserFromDB(data.user.id, email, data.user.user_metadata?.name);
      
      // Stocker localement l'utilisateur
      await this.setCurrentUser(user);
      
      // Afficher un toast de succès
      showSuccessToast('Connexion réussie !');
      
      return user;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log(`Tentative d'inscription avec email: ${email} et nom: ${name}`);
      
      // Créer un nouvel utilisateur avec Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        console.error('Erreur d\'inscription Supabase:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Aucun utilisateur retourné après l\'inscription');
      }

      console.log(`Utilisateur créé avec succès dans Supabase Auth. ID: ${data.user.id}`);
      
      // Créer l'utilisateur dans la table users
      const user = await this.createUserInDB(data.user.id, email, name);
      
      // Stocker localement l'utilisateur
      await this.setCurrentUser(user);
      
      // Afficher un toast de succès
      showSuccessToast('Inscription réussie ! Bienvenue !');
      
      console.log('Inscription terminée avec succès');
      return user;
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Déconnexion de Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erreur lors de la déconnexion Supabase:', error);
        throw error;
      }
      
      // Supprimer les données locales
      await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
      await AsyncStorage.removeItem(this.TOKEN_STORAGE_KEY);
      
      // Afficher un toast de succès
      showSuccessToast('Vous êtes déconnecté');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      // Vérifier d'abord si un utilisateur Supabase est connecté
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        // Si l'utilisateur Supabase est connecté, récupérer ses données depuis la table users
        return this.getUserDataFromDB(supabaseUser.id, supabaseUser.email || '');
      }
      
      // Sinon, essayer de récupérer depuis le stockage local
      const userJson = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      // Log silencieux en mode production
      if (process.env.NODE_ENV === 'development') {
        console.log('Erreur lors de la récupération du user (info):', error);
      }
      return null;
    }
  }

  /**
   * Récupère les données utilisateur depuis la table users de Supabase
   */
  private static async getUserDataFromDB(authUserId: string, email: string): Promise<User> {
    try {
      // Chercher l'utilisateur dans la table users par auth_user_id
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) {
        // Si l'utilisateur n'existe pas, le créer
        console.log(`Utilisateur non trouvé dans la DB, création...`);
        return this.createUserInDB(authUserId, email, email.split('@')[0] || 'Anonymous');
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created_at,
        avatar: data.avatar,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      // Retourner un utilisateur minimal en cas d'erreur
      return {
        id: authUserId,
        email: email,
        name: email.split('@')[0] || 'Anonymous',
        created: new Date().toISOString(),
      };
    }
  }

  /**
   * Crée un utilisateur dans la table users de Supabase
   */
  private static async createUserInDB(authUserId: string, email: string, name: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: email,
          name: name,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de l\'utilisateur dans la DB:', error);
        // Même en cas d'erreur, retourner un utilisateur minimal
        return {
          id: authUserId,
          email: email,
          name: name,
          created: new Date().toISOString(),
        };
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created_at,
        avatar: data.avatar,
      };
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return {
        id: authUserId,
        email: email,
        name: name,
        created: new Date().toISOString(),
      };
    }
  }

  /**
   * Récupère ou crée un utilisateur dans la table users
   */
  private static async getOrCreateUserFromDB(authUserId: string, email: string, name?: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) {
        // Créer l'utilisateur s'il n'existe pas
        return this.createUserInDB(authUserId, email, name || email.split('@')[0] || 'Anonymous');
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created_at,
        avatar: data.avatar,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération/création de l\'utilisateur:', error);
      return this.createUserInDB(authUserId, email, name || email.split('@')[0] || 'Anonymous');
    }
  }

  static async setCurrentUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  static async getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  static async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  }

  /**
   * Envoie un email de réinitialisation de mot de passe via Resend
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      console.log(`Tentative d'envoi d'email de réinitialisation pour: ${email}`);

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Adresse email invalide');
      }

      // Appeler notre Edge Function pour générer le token et envoyer l'email via Resend
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'send-password-reset-email',
        {
          body: {
            email: email,
          },
        }
      );

      if (functionError) {
        console.error('Erreur lors de l\'appel de la fonction Edge:', functionError);
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        // On affiche un message générique de succès
        showSuccessToast('Si cet email existe, un lien de réinitialisation a été envoyé.');
        return;
      }

      console.log('✅ Email de réinitialisation envoyé avec succès');
      showSuccessToast('Un email de réinitialisation a été envoyé à votre adresse');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      // Pour des raisons de sécurité, on ne révèle pas l'erreur exacte
      // On affiche un message générique de succès
      showSuccessToast('Si cet email existe, un lien de réinitialisation a été envoyé.');
    }
  }

  /**
   * Réinitialise le mot de passe avec un token
   */
  static async resetPassword(newPassword: string, token: string, email: string): Promise<void> {
    try {
      console.log('Tentative de réinitialisation du mot de passe');

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (!token) {
        throw new Error('Token de réinitialisation requis');
      }

      if (!email) {
        throw new Error('Email requis');
      }

      // Vérifier le token et mettre à jour le mot de passe
      // Supabase utilise verifyOtp pour les tokens de réinitialisation
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
        email: email,
      });

      if (verifyError) {
        console.error('Erreur lors de la vérification du token:', verifyError);
        throw new Error('Token invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.');
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe:', updateError);
        throw updateError;
      }

      console.log('✅ Mot de passe réinitialisé avec succès');
      showSuccessToast('Votre mot de passe a été réinitialisé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }
}

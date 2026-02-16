// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { supabase } from '../config/supabase';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { getEnv } from '../utils/env';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Fermer la session web après authentification
WebBrowser.maybeCompleteAuthSession();

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
   * Vérifie le code OTP de réinitialisation
   */
  static async verifyResetCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('Vérification du code de réinitialisation');

      if (!email || !code) {
        throw new Error('Email et code requis');
      }

      // Appeler notre Edge Function pour vérifier le code
      const { data, error } = await supabase.functions.invoke(
        'verify-reset-code',
        {
          body: {
            email: email,
            code: code,
          },
        }
      );

      if (error) {
        console.error('Erreur lors de la vérification du code:', error);
        throw new Error('Code invalide ou expiré');
      }

      return data?.success === true;
    } catch (error: any) {
      console.error('Erreur lors de la vérification du code:', error);
      throw error;
    }
  }

  /**
   * Réinitialise le mot de passe avec un code OTP
   */
  static async resetPassword(newPassword: string, code: string, email: string): Promise<void> {
    try {
      console.log('Tentative de réinitialisation du mot de passe');

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (!code) {
        throw new Error('Code de réinitialisation requis');
      }

      if (!email) {
        throw new Error('Email requis');
      }

      // Appeler notre Edge Function pour vérifier le code et réinitialiser le mot de passe
      const { data, error } = await supabase.functions.invoke(
        'verify-reset-code',
        {
          body: {
            email: email,
            code: code,
            newPassword: newPassword,
          },
        }
      );

      if (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de la réinitialisation du mot de passe');
      }

      console.log('✅ Mot de passe réinitialisé avec succès');
      showSuccessToast('Votre mot de passe a été réinitialisé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Connexion avec Google OAuth
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔵 Début de la connexion Google...');

      // Créer l'URL de redirection
      // En développement, utiliser useProxy pour Expo Go
      // En production, utiliser le scheme personnalisé
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'com.unify.app',
        path: 'auth/callback',
        useProxy: __DEV__, // Utiliser le proxy Expo en développement
      });

      console.log('📍 URL de redirection:', redirectTo);
      console.log('🔧 Mode développement:', __DEV__);

      // Démarrer la session OAuth avec Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Erreur OAuth Google:', error);
        throw error;
      }

      if (!data.url) {
        throw new Error('Aucune URL retournée par Supabase');
      }

      // Ouvrir le navigateur pour l'authentification
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success') {
        // Extraire le code d'authentification de l'URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          // Échanger le code contre un token
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ Erreur lors de l\'échange du code:', sessionError);
            throw sessionError;
          }

          if (!sessionData.user) {
            throw new Error('Aucun utilisateur retourné après l\'authentification');
          }

          console.log('✅ Connexion Google réussie pour l\'utilisateur:', sessionData.user.id);

          // Récupérer les informations utilisateur
          const email = sessionData.user.email || '';
          const name = sessionData.user.user_metadata?.full_name || 
                       sessionData.user.user_metadata?.name || 
                       email.split('@')[0] || 
                       'Utilisateur Google';

          // Récupérer ou créer les données utilisateur dans la table users
          const user = await this.getOrCreateUserFromDB(sessionData.user.id, email, name);

          // Stocker localement l'utilisateur
          await this.setCurrentUser(user);

          showSuccessToast('Connexion Google réussie !');
          return user;
        } else {
          throw new Error('Code d\'authentification non trouvé dans l\'URL');
        }
      } else {
        throw new Error('L\'utilisateur a annulé l\'authentification');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion Google:', error);
      showErrorToast(error.message || 'Erreur lors de la connexion Google');
      throw error;
    }
  }

  /**
   * Connexion avec Apple (iOS uniquement)
   */
  static async signInWithApple(): Promise<User> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In est uniquement disponible sur iOS');
      }

      console.log('🍎 Début de la connexion Apple...');

      // Vérifier si Apple Authentication est disponible
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Authentication n\'est pas disponible sur cet appareil');
      }

      // Demander les informations d'authentification Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Token d\'identité Apple non reçu');
      }

      console.log('✅ Credential Apple reçu');

      // Authentifier avec Supabase en utilisant le token Apple
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce || undefined,
      });

      if (error) {
        console.error('❌ Erreur OAuth Apple:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Aucun utilisateur retourné après l\'authentification');
      }

      console.log('✅ Connexion Apple réussie pour l\'utilisateur:', data.user.id);

      // Récupérer les informations utilisateur
      const email = data.user.email || credential.email || '';
      const name = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : data.user.user_metadata?.full_name || 
          data.user.user_metadata?.name || 
          email.split('@')[0] || 
          'Utilisateur Apple';

      // Récupérer ou créer les données utilisateur dans la table users
      const user = await this.getOrCreateUserFromDB(data.user.id, email, name);

      // Stocker localement l'utilisateur
      await this.setCurrentUser(user);

      showSuccessToast('Connexion Apple réussie !');
      return user;
    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion Apple:', error);
      
      // Ne pas afficher d'erreur si l'utilisateur a annulé
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        showErrorToast(error.message || 'Erreur lors de la connexion Apple');
      }
      
      throw error;
    }
  }
}

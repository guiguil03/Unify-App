// src/services/AuthService.ts
import { User } from '../types/user';
import { supabase } from '../config/supabase';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { validatePassword, formatPasswordErrors, normalizeEmail, sanitizeName } from '../utils/validation';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Fermer la session web après authentification
WebBrowser.maybeCompleteAuthSession();

export class AuthService {

  static async login(email: string, password: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Aucun utilisateur retourné après la connexion');
    }

    const user = await this.getOrCreateUserFromDB(data.user.id, normalizedEmail, data.user.user_metadata?.name);

    showSuccessToast('Connexion réussie !');
    return user;
  }

  static async register(name: string, email: string, password: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const sanitizedName = sanitizeName(name);

    // Validation du mot de passe
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(formatPasswordErrors(passwordCheck.errors));
    }

    // Passe par l'Edge Function (admin API) pour contourner le rate limit Supabase
    const { data, error } = await supabase.functions.invoke('register-user', {
      body: { name: sanitizedName, email: normalizedEmail, password },
    });

    if (error) {
      throw new Error(error.message || "Échec de l'inscription");
    }

    if (data?.error) {
      throw new Error(data.error);
    }
  }

  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    showSuccessToast('Vous êtes déconnecté');
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (supabaseUser) {
        return this.getUserDataFromDB(supabaseUser.id, supabaseUser.email || '');
      }

      return null;
    } catch {
      return null;
    }
  }

  // Récupère le profil DB depuis un user de session (pas de réseau, juste DB)
  static async getUserFromSession(sessionUser: { id: string; email?: string | null }): Promise<User | null> {
    try {
      return await this.getUserDataFromDB(sessionUser.id, sessionUser.email || '');
    } catch {
      return null;
    }
  }

  /**
   * Récupère les données utilisateur depuis la table users de Supabase
   */
  private static async getUserDataFromDB(authUserId: string, email: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !data) {
      return this.createUserInDB(authUserId, email, email.split('@')[0] || 'Anonymous');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      created: data.created_at,
      avatar: data.avatar,
    };
  }

  /**
   * Crée un utilisateur dans la table users de Supabase
   */
  private static async createUserInDB(authUserId: string, email: string, name: string): Promise<User> {
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

    if (error || !data) {
      // Retourner un utilisateur minimal en cas d'erreur DB
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
  }

  /**
   * Récupère ou crée un utilisateur dans la table users
   */
  private static async getOrCreateUserFromDB(authUserId: string, email: string, name?: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !data) {
      return this.createUserInDB(authUserId, email, name || email.split('@')[0] || 'Anonymous');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      created: data.created_at,
      avatar: data.avatar,
    };
  }

  static async getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  }

  /**
   * Envoie un email de réinitialisation de mot de passe via Resend
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Adresse email invalide');
    }

    try {
      const { error: functionError } = await supabase.functions.invoke(
        'send-password-reset-email',
        {
          body: { email: normalizedEmail },
        }
      );

      if (functionError) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        showSuccessToast('Si cet email existe, un code de réinitialisation a été envoyé.');
        return;
      }

      showSuccessToast('Un code de réinitialisation a été envoyé à votre adresse');
    } catch {
      // Pour des raisons de sécurité, message générique
      showSuccessToast('Si cet email existe, un code de réinitialisation a été envoyé.');
    }
  }

  /**
   * Vérifie le code OTP de réinitialisation
   */
  static async verifyResetCode(email: string, code: string): Promise<boolean> {
    if (!email || !code) {
      throw new Error('Email et code requis');
    }

    const { data, error } = await supabase.functions.invoke(
      'verify-reset-code',
      {
        body: {
          email: normalizeEmail(email),
          code: code,
        },
      }
    );

    if (error) {
      throw new Error('Code invalide ou expiré');
    }

    return data?.success === true;
  }

  /**
   * Réinitialise le mot de passe avec un code OTP
   */
  static async resetPassword(newPassword: string, code: string, email: string): Promise<void> {
    if (!code) {
      throw new Error('Code de réinitialisation requis');
    }

    if (!email) {
      throw new Error('Email requis');
    }

    // Validation du nouveau mot de passe
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      throw new Error(formatPasswordErrors(passwordCheck.errors));
    }

    const { data, error } = await supabase.functions.invoke(
      'verify-reset-code',
      {
        body: {
          email: normalizeEmail(email),
          code: code,
          newPassword: newPassword,
        },
      }
    );

    if (error) {
      throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Erreur lors de la réinitialisation du mot de passe');
    }

    showSuccessToast('Votre mot de passe a été réinitialisé avec succès');
  }

  /**
   * Connexion avec Google OAuth
   */
  static async signInWithGoogle(): Promise<User> {
    const redirectTo = AuthSession.makeRedirectUri({
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Empêche Supabase d'ouvrir le navigateur lui-même, on gère avec WebBrowser
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('Aucune URL retournée par Supabase');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    if (result.type !== 'success') {
      throw new Error('L\'utilisateur a annulé l\'authentification ou l\'URL n\'a pas été interceptée correctement.');
    }

    // Extraction robuste de l'URL sans utiliser l'objet global URL (buggy sur RN)
    const returnUrl = result.url;
    
    // Supabase ajoute souvent les paramètres en fragment (hash #) ou en query (?)
    const urlParamsStr = returnUrl.includes('#') ? returnUrl.split('#')[1] : returnUrl.split('?')[1];
    if (!urlParamsStr) {
       throw new Error('Paramètres d\'authentification manquants dans l\'URL de retour.');
    }

    // Parser les paramètres
    const params = new URLSearchParams(urlParamsStr);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
       throw new Error('Token d\'authentification non trouvé dans l\'URL. (Redirect URL potentiellement mal configurée)');
    }

    // Établir manuellement la session avec Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError) throw sessionError;
    if (!sessionData.user) throw new Error('Aucun utilisateur retourné après l\'authentification');

    const userEmail = sessionData.user.email || '';
    const userName = sessionData.user.user_metadata?.full_name ||
                     sessionData.user.user_metadata?.name ||
                     userEmail.split('@')[0] ||
                     'Utilisateur Google';

    const user = await this.getOrCreateUserFromDB(sessionData.user.id, userEmail, userName);

    showSuccessToast('Connexion Google réussie !');
    return user;
  }

  /**
   * Connexion avec Apple (iOS uniquement)
   */
  static async signInWithApple(): Promise<User> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In est uniquement disponible sur iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Authentication n\'est pas disponible sur cet appareil');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Token d\'identité Apple non reçu');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: (credential as any).nonce || undefined,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Aucun utilisateur retourné après l\'authentification');
    }

    const userEmail = data.user.email || credential.email || '';
    const userName = credential.fullName
      ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
      : data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        userEmail.split('@')[0] ||
        'Utilisateur Apple';

    const user = await this.getOrCreateUserFromDB(data.user.id, userEmail, userName);

    showSuccessToast('Connexion Apple réussie !');
    return user;
  }
}

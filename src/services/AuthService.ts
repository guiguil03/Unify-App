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

  static async register(name: string, email: string, password: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);
    const sanitizedName = sanitizeName(name);

    // Validation du mot de passe
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(formatPasswordErrors(passwordCheck.errors));
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: sanitizedName,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Aucun utilisateur retourné après l\'inscription');
    }

    const user = await this.createUserInDB(data.user.id, normalizedEmail, sanitizedName);

    showSuccessToast('Inscription réussie ! Bienvenue !');
    return user;
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
      scheme: 'com.unify.app',
      path: 'auth/callback',
    });

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
      throw error;
    }

    if (!data.url) {
      throw new Error('Aucune URL retournée par Supabase');
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    if (result.type !== 'success') {
      throw new Error('L\'utilisateur a annulé l\'authentification');
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('Code d\'authentification non trouvé dans l\'URL');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.user) {
      throw new Error('Aucun utilisateur retourné après l\'authentification');
    }

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
      nonce: credential.nonce || undefined,
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

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { AuthService } from "../services/AuthService";
import { User } from "../types/user";
import { supabase } from "../config/supabase";
import { showErrorToast } from "../utils/errorHandler";

// Session timeout : 30 jours d'inactivité (en ms)
const SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isSkipped: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
  hasCompletedInitialCheck: boolean;
  authenticating: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipped, setIsSkipped] = useState(false);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] =
    useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const authAttemptsRef = useRef<number[]>([]);

  // Tracker l'activité pour le session timeout
  const updateLastActive = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  // Vérifier le session timeout quand l'app revient au premier plan
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active' && user) {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed > SESSION_TIMEOUT_MS) {
          // Session expirée par inactivité
          await signOut();
          showErrorToast("Session expirée. Veuillez vous reconnecter.");
          return;
        }
      }
      if (nextState === 'active') {
        updateLastActive();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [user, updateLastActive]);

  useEffect(() => {
    async function loadUserFromStorage() {
      try {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          updateLastActive();
        }
      } catch {
        // Session invalide ou expirée
      } finally {
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      }
    }

    if (!supabase?.auth) {
      setIsLoading(false);
      setHasCompletedInitialCheck(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        if (session?.user) {
          try {
            const userData = await AuthService.getCurrentUser();
            if (userData) {
              setUser(userData);
              updateLastActive();
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      }
    );

    loadUserFromStorage();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Rate limiting : max 5 tentatives par minute
  function checkRateLimit(): boolean {
    const now = Date.now();
    // Garder uniquement les tentatives de la dernière minute
    authAttemptsRef.current = authAttemptsRef.current.filter(t => now - t < 60_000);
    if (authAttemptsRef.current.length >= 5) {
      const oldestAttempt = authAttemptsRef.current[0];
      const waitSeconds = Math.ceil((60_000 - (now - oldestAttempt)) / 1000);
      showErrorToast(`Trop de tentatives. Réessayez dans ${waitSeconds}s`);
      return false;
    }
    authAttemptsRef.current.push(now);
    return true;
  }

  async function signIn(email: string, password: string) {
    if (!checkRateLimit()) return false;
    setAuthenticating(true);
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
      updateLastActive();
      return true;
    } catch (error: any) {
      if (__DEV__) console.error('Sign in failed:', error);
      showErrorToast(error.message || "Échec de la connexion");
      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(name: string, email: string, password: string) {
    if (!checkRateLimit()) return false;
    setAuthenticating(true);
    try {
      const user = await AuthService.register(name, email, password);
      setUser(user);
      updateLastActive();
      return true;
    } catch (error: any) {
      if (__DEV__) console.error('Sign up failed:', error);
      showErrorToast(error.message || "Échec de l'inscription");
      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function signInWithGoogle() {
    setAuthenticating(true);
    try {
      const user = await AuthService.signInWithGoogle();
      setUser(user);
      return true;
    } catch (error) {
      if (__DEV__) console.error('Google sign in failed:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function signInWithApple() {
    setAuthenticating(true);
    try {
      const user = await AuthService.signInWithApple();
      setUser(user);
      return true;
    } catch (error) {
      if (__DEV__) console.error('Apple sign in failed:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function signOut() {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setIsSkipped(false);
    } catch (error) {
      if (__DEV__) console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function skipAuth() {
    setIsSkipped(true);
    setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSkipped,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        skipAuth,
        hasCompletedInitialCheck,
        authenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider"
    );
  }
  return context;
}

import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthService } from "../services/AuthService";
import { User } from "../types/user";
import { supabase } from "../config/supabase";
import { showErrorToast } from "../utils/errorHandler";

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

  useEffect(() => {
    async function loadUserFromStorage() {
      try {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
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

  async function signIn(email: string, password: string) {
    setAuthenticating(true);
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
      return true;
    } catch (error: any) {
      showErrorToast(error.message || "Échec de la connexion");
      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(name: string, email: string, password: string) {
    setAuthenticating(true);
    try {
      const user = await AuthService.register(name, email, password);
      setUser(user);
      return true;
    } catch (error: any) {
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
    } catch {
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
    } catch {
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
    } catch {
      // Erreur de déconnexion silencieuse
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

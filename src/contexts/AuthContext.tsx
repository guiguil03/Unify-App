import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthService } from "../services/AuthService";
import { User } from "../types/user";
import { auth } from "../config/firebase";
import { handleFirebaseError } from "../utils/errorHandler";

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isSkipped: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
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
    // Vérifier l'état d'authentification au démarrage
    async function loadUserFromStorage() {
      try {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        // Log silencieux
        handleFirebaseError(error, "Erreur lors du chargement du profil");
      } finally {
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      }
    }

    // Écouter les changements d'état d'authentification
    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          try {
            // L'utilisateur est connecté, récupérer ou créer ses données
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            // Log silencieux
            handleFirebaseError(
              error,
              "Erreur lors de la mise à jour du profil"
            );
          }
        } else {
          // L'utilisateur est déconnecté
          setUser(null);
        }
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      },
      (error) => {
        // Gestionnaire d'erreur pour onAuthStateChanged
        // Log silencieux
        handleFirebaseError(
          error,
          "Problème de surveillance de l'authentification"
        );
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      }
    );

    // Vérification initiale
    loadUserFromStorage();

    // Se désabonner quand le composant est démonté
    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    setAuthenticating(true);
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
      return true;
    } catch (error) {
      handleFirebaseError(error, "Échec de la connexion");
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
    } catch (error) {
      handleFirebaseError(error, "Échec de l'inscription");
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
      console.error("Erreur lors de la déconnexion:", error);
      handleFirebaseError(error, "Erreur lors de la déconnexion");
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

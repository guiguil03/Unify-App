import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../services/AuthService';
import { User } from '../types/user';
import { auth } from '../config/firebase';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isSkipped: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
  hasCompletedInitialCheck: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipped, setIsSkipped] = useState(false);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);

  useEffect(() => {
    // Vérifier l'état d'authentification au démarrage
    async function loadUserFromStorage() {
      try {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur:', error);
      } finally {
        setIsLoading(false);
        setHasCompletedInitialCheck(true);
      }
    }

    // Écouter les changements d'état d'authentification
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          // L'utilisateur est connecté, récupérer ou créer ses données
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors de la mise à jour du profil:', error);
        }
      } else {
        // L'utilisateur est déconnecté
        setUser(null);
      }
      setIsLoading(false);
      setHasCompletedInitialCheck(true);
    });

    // Vérification initiale
    loadUserFromStorage();

    // Se désabonner quand le composant est démonté
    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(name: string, email: string, password: string) {
    setIsLoading(true);
    try {
      const user = await AuthService.register(name, email, password);
      setUser(user);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setIsSkipped(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}

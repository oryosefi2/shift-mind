import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createAuthProvider } from '../auth';
import type { AuthProvider as IAuthProvider, Session, User } from '../auth/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authProvider] = useState<IAuthProvider>(() => createAuthProvider());

  useEffect(() => {
    let mounted = true;

    // Initialize session
    const initializeAuth = async () => {
      try {
        const currentSession = await authProvider.getSession();
        if (mounted) {
          setSession(currentSession);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    // Listen for auth state changes
    const unsubscribe = authProvider.onAuthStateChange((newSession: Session | null) => {
      if (mounted) {
        setSession(newSession);
        setLoading(authProvider.isLoading());
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [authProvider]);

  const signIn = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const result = await authProvider.signIn(email);
      return result;
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await authProvider.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, we should clear local state
      setSession(null);
    }
  };

  const value: AuthContextType = {
    user: session?.user || null,
    session,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// Authentication types and interfaces
export interface User {
  id: string;
  email: string;
  business_id: string | null;
}

export interface Session {
  user: User;
  access_token?: string;
  expires_at?: number;
}

export interface AuthProvider {
  getSession(): Promise<Session | null>;
  signIn(email: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (session: Session | null) => void): () => void;
  // Additional methods for future expansion
  isLoading(): boolean;
}

export type AuthProviderType = 'simple' | 'supabase';

export interface AuthError {
  message: string;
  code?: string;
}

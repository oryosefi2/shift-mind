import { AuthProvider, Session, User } from './types';

const STORAGE_KEY = 'shiftmind_auth_session';

export class SimpleAuthProvider implements AuthProvider {
  private session: Session | null = null;
  private loading: boolean = true;
  private listeners: Set<(session: Session | null) => void> = new Set();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession) as Session;
        
        // Check if session is expired (if expires_at exists)
        if (parsedSession.expires_at && parsedSession.expires_at < Date.now()) {
          localStorage.removeItem(STORAGE_KEY);
          this.session = null;
        } else {
          this.session = parsedSession;
        }
      }
    } catch (error) {
      console.error('Error initializing auth session:', error);
      localStorage.removeItem(STORAGE_KEY);
      this.session = null;
    } finally {
      this.loading = false;
      this.notifyListeners();
    }
  }

  async getSession(): Promise<Session | null> {
    return this.session;
  }

  async signIn(email: string): Promise<{ error: Error | null }> {
    try {
      // Simulate OTP/Magic Link flow for demo purposes
      console.log(`[SimpleAuth] Simulating sign-in for: ${email}`);
      
      // Create mock user with demo business_id
      const user: User = {
        id: `user_${Date.now()}`,
        email: email,
        business_id: '11111111-1111-1111-1111-111111111111'
      };

      // Create session (expires in 24 hours for demo)
      const session: Session = {
        user,
        access_token: `demo_token_${Date.now()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      // Store session
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      this.session = session;
      this.notifyListeners();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    this.session = null;
    this.notifyListeners();
  }

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current session if not loading
    if (!this.loading) {
      callback(this.session);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  isLoading(): boolean {
    return this.loading;
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.session);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }
}

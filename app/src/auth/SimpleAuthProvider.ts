import { AuthProvider, Session, User } from './types';

const STORAGE_KEY = 'shiftmind_auth_session';

export class SimpleAuthProvider implements AuthProvider {
  private session: Session | null = null;
  private loading: boolean = true;
  private listeners: Set<(session: Session | null) => void> = new Set();
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('[SimpleAuth] Starting initialization...');
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      console.log('[SimpleAuth] Stored session:', !!storedSession);
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession) as Session;
        console.log('[SimpleAuth] Parsed session:', parsedSession);
        
        // Check if session is expired (if expires_at exists)
        if (parsedSession.expires_at && parsedSession.expires_at < Date.now()) {
          console.log('[SimpleAuth] Session expired, clearing');
          localStorage.removeItem(STORAGE_KEY);
          this.session = null;
        } else {
          // Skip business validation for now to debug the hydration issue
          this.session = parsedSession;
          console.log('[SimpleAuth] Session restored successfully');
        }
      }
    } catch (error) {
      console.error('Error initializing auth session:', error);
      localStorage.removeItem(STORAGE_KEY);
      this.session = null;
    } finally {
      this.loading = false;
      console.log('[SimpleAuth] Initialization complete, loading:', this.loading);
      this.notifyListeners();
    }
  }

  async getSession(): Promise<Session | null> {
    // Wait for initialization to complete before returning session
    await this.initPromise;
    console.log('[SimpleAuth] getSession() after init, returning:', !!this.session);
    return this.session;
  }

  async signIn(email: string): Promise<{ error: Error | null }> {
    try {
      // Simulate OTP/Magic Link flow for demo purposes
      console.log(`[SimpleAuth] Simulating sign-in for: ${email}`);
      
      // Try to get an existing valid business, or create a new one
      let businessId = '579bc62a-9cdf-4493-b7a6-b649d6de4491';
      
      try {
        // Check if the default business exists
        const checkResponse = await fetch(`http://localhost:8084/businesses?business_id=${businessId}`);
        if (!checkResponse.ok || (await checkResponse.json()).length === 0) {
          // Create a new business if the default one doesn't exist
          const createResponse = await fetch('http://localhost:8084/businesses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'העסק שלי',
              industry: 'כללי',
              timezone: 'Asia/Jerusalem'
            })
          });
          
          if (createResponse.ok) {
            const newBusiness = await createResponse.json();
            businessId = newBusiness.id;
            console.log(`[SimpleAuth] Created new business: ${businessId}`);
          }
        }
      } catch (err) {
        console.warn('[SimpleAuth] Could not verify/create business, using default ID');
      }
      
      // Create mock user with business_id
      const user: User = {
        id: `user_${Date.now()}`,
        email: email,
        business_id: businessId
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

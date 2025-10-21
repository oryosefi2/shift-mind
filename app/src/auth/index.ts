import { AuthProvider, AuthProviderType } from './types';
import { SimpleAuthProvider } from './SimpleAuthProvider';
// import { SupabaseAuthProvider } from './SupabaseAuthProvider'; // TODO: Add in future

export function createAuthProvider(): AuthProvider {
  const providerType = (import.meta.env.VITE_AUTH_PROVIDER as AuthProviderType) || 'simple';
  
  switch (providerType) {
    case 'simple':
      return new SimpleAuthProvider();
    case 'supabase':
      // TODO: Implement SupabaseAuthProvider in the future
      throw new Error('Supabase auth provider not yet implemented. Use VITE_AUTH_PROVIDER=simple');
    default:
      console.warn(`Unknown auth provider: ${providerType}. Falling back to simple.`);
      return new SimpleAuthProvider();
  }
}

// Export for testing and direct usage
export { SimpleAuthProvider };
export type { AuthProvider, AuthProviderType };

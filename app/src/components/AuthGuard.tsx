import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, hydrated } = useAuth();

  console.log('🔒 AuthGuard - user:', !!user, 'loading:', loading, 'hydrated:', hydrated);

  // Wait for both loading to finish AND auth state to be hydrated from storage
  if (loading || !hydrated) {
    console.log('🔒 AuthGuard - Still loading or not hydrated, showing spinner');
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔒 AuthGuard - No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔒 AuthGuard - User authenticated, rendering children');
  return <>{children}</>;
};
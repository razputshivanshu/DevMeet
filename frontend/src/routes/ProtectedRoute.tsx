import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/contexts/auth.store';
import { authService } from '@/features/auth/auth.api';

/**
 * Guards a subtree behind an authenticated session. Hydrates the user from
 * `/auth/me` if a token is present but no user is cached.
 */
export const ProtectedRoute = () => {
  const { token, user, hydrated, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (token && !user) {
      authService
        .me()
        .then(setUser)
        .catch(() => logout());
    }
  }, [hydrated, token, user, setUser, logout]);

  if (!hydrated) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <div className="p-8 text-sm text-muted-foreground">Loading session…</div>;

  return <Outlet />;
};

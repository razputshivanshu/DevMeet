import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '@/lib/api';
import { authService } from '@/features/auth/auth.api';
import { useAuthStore } from '@/contexts/auth.store';

export const OAuthCallbackPage = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      nav('/login?error=oauth');
      return;
    }
    setToken(token);
    authService
      .me()
      .then((user) => {
        setSession({ user, token });
        nav('/app');
      })
      .catch(() => nav('/login?error=oauth'));
  }, [params, nav, setSession]);

  return (
    <div
      className="flex h-screen items-center justify-center text-sm text-muted-foreground"
      data-testid="oauth-loading"
    >
      Completing sign-in…
    </div>
  );
};

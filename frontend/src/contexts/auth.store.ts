import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { setToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setSession: (payload: { user: User; token: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setSession: ({ user, token }) => {
        setToken(token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        setToken(null);
        set({ user: null, token: null });
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'devmeet.auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token);
        state?.setHydrated();
      },
    },
  ),
);

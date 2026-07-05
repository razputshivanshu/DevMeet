import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { setToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  activeOrgId: string | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setSession: (payload: { user: User; token: string }) => void;
  setUser: (user: User) => void;
  setActiveOrg: (orgId: string | null) => void;
  logout: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeOrgId: null,
      theme: 'light',
      sidebarOpen: true,
      hydrated: false,
      setAuth: (user, token) => {
        setToken(token);
        set({ user, token });
      },
      setSession: ({ user, token }) => {
        setToken(token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      setActiveOrg: (orgId) => set({ activeOrgId: orgId }),
      logout: () => {
        setToken(null);
        set({ user: null, token: null, activeOrgId: null });
      },
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'devmeet.auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        activeOrgId: state.activeOrgId,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token);
        state?.setHydrated();
      },
    },
  ),
);

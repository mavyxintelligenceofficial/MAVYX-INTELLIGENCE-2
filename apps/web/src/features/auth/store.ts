import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

/**
 * Auth store — persisted to localStorage.
 * Token survives page refresh.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,

      setSession: (user, token) => {
        set({ user, token, isHydrated: true });
      },

      logout: () => {
        set({ user: null, token: null, isHydrated: true });
      },

      hydrate: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'mavyx-auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    }
  )
);

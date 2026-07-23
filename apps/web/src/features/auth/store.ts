import { create } from 'zustand';
import { AuthUser } from './types';

const TOKEN_STORAGE_KEY = 'mavyx_access_token';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

/**
 * Holds the logged-in user and JWT for the whole app. The token is
 * mirrored into localStorage so a page refresh doesn't log the person
 * out - this is a real browser app (not a Claude artifact preview), so
 * localStorage is the correct, standard tool for this.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setSession: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    set({ user, token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({ user: null, token: null });
  },

  /**
   * Called once on app load (see AuthProvider) to restore the token from
   * localStorage. We only get the token back this way, not the full user
   * object - pages that need the user should re-fetch /profile if needed.
   */
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    set({ token, isHydrated: true });
  },
}));

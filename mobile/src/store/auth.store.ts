/** Global auth state (zustand). Persists tokens via secure storage. */
import { create } from 'zustand';
import { tokenStorage } from '@/lib/storage';
import { authApi } from '@/api/endpoints';
import { setAuthExpiredHandler } from '@/api/client';
import type { AuthResult, AuthUser } from '@/types/api';

interface AuthState {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  /** Called once on app boot to restore a session from stored tokens. */
  bootstrap: () => Promise<void>;
  setSession: (result: AuthResult) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  bootstrap: async () => {
    const token = await tokenStorage.getAccess();
    if (!token) return set({ status: 'unauthenticated', user: null });
    try {
      const user = await authApi.me();
      set({ user, status: 'authenticated' });
    } catch {
      await tokenStorage.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },

  setSession: async (result) => {
    await tokenStorage.save(result.accessToken, result.refreshToken);
    set({ user: result.user, status: 'authenticated' });
  },

  logout: async () => {
    const refreshToken = await tokenStorage.getRefresh();
    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // best-effort; clear locally regardless
    }
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },
}));

// Wire the Axios "auth expired" hook to force a logout when refresh fails.
setAuthExpiredHandler(() => {
  void tokenStorage.clear();
  useAuthStore.setState({ status: 'unauthenticated', user: null });
});

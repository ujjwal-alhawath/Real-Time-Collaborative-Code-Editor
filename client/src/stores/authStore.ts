import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@codesync/shared';
import { api } from '../lib/api';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, accessToken: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        api.post('/auth/logout').catch(() => {});
      },
      checkAuth: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      // Only persist the user, token rotation handles the rest, but we keep token in memory/storage for ease. 
      // Zustand persist saves to localStorage by default.
    }
  )
);

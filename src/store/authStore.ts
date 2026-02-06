import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createId } from '@/lib/utils/id';
import { mapToCamel } from '@/lib/utils/case';

interface AuthState {
  userId: string | null;
  storeId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  loginId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      storeId: null,
      token: null,
      isAuthenticated: false,
      loginId: null,
      login: async (username, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || 'Nama pengguna atau kata sandi salah');
        }

        const payload = (await res.json()) as { data: { user: Record<string, any> } };
        const user = mapToCamel(payload.data.user) as { id: string; storeId: string };

        set({
          userId: user.id,
          storeId: user.storeId,
          token: createId('token'),
          isAuthenticated: true,
          loginId: createId('login'),
        });
      },
      logout: () => {
        set({
          userId: null,
          storeId: null,
          token: null,
          isAuthenticated: false,
          loginId: null,
        });
      },
    }),
    {
      name: 'pos-pro-auth',
    }
  )
);

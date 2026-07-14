import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AuthLoginResponse, User } from '@blog/shared';

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  token: string;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const authStorageKey = 'blog-web-auth';

function readStoredAuth(): AuthLoginResponse | null {
  const stored = window.localStorage.getItem(authStorageKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthLoginResponse;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthLoginResponse | null>(() => readStoredAuth());

  async function login(email: string, password: string) {
    await authenticate('/api/auth/login', { email, password });
  }

  async function register(name: string, email: string, password: string) {
    await authenticate('/api/auth/register', { email, name, password });
  }

  async function authenticate(path: string, body: Record<string, string>) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const nextAuth = (await response.json()) as AuthLoginResponse;
    window.localStorage.setItem(authStorageKey, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }

  function logout() {
    window.localStorage.removeItem(authStorageKey);
    setAuth(null);
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
      register,
      token: auth?.token ?? '',
      user: auth?.user ?? null,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

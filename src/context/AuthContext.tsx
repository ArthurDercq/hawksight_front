import { createContext, useState, useCallback, ReactNode } from 'react';
import { authApi, apiClient } from '@/services/api';
import type { CurrentUser } from '@/types';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  loginWithStravaCode: (code: string) => Promise<true | 403 | 'register' | string>;
  loginWithCredentials: (identifier: string, password: string) => Promise<true | 401 | string>;
  registerWithOnboarding: (onboardingToken: string, username: string, email: string, password: string) => Promise<true | string>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function decodeUser(token: string): CurrentUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      role: payload.role ?? 'user',
      username: payload.username ?? '',
    };
  } catch {
    return null;
  }
}

function handleApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
    const detail = axiosError.response?.data?.detail;
    if (detail) return detail;
    if (axiosError.response?.status && axiosError.response.status >= 500) return 'Erreur serveur, réessaie dans un moment';
  }
  if (error instanceof Error && error.message === 'Network Error') return 'Impossible de contacter le serveur';
  return 'Une erreur est survenue';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('eyesight_token');
    if (t && !isTokenExpired(t)) return t;
    localStorage.removeItem('eyesight_token');
    return null;
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const t = localStorage.getItem('eyesight_token');
    return (t && !isTokenExpired(t)) ? decodeUser(t) : null;
  });
  // localStorage is synchronous — token is known before first render, no loading state needed
  const isLoading = false;

  const _persistToken = useCallback((access_token: string) => {
    localStorage.setItem('eyesight_token', access_token);
    setToken(access_token);
    setCurrentUser(decodeUser(access_token));
  }, []);

  const loginWithStravaCode = useCallback(async (code: string): Promise<true | 403 | 'register' | string> => {
    try {
      const { access_token } = await authApi.exchangeStravaCode(code);
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      // Token onboarding (nouvel user) — pas de role complet, redirect vers register
      if (payload.type === 'onboarding') {
        return 'register';
      }
      _persistToken(access_token);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) return 403;
      }
      return handleApiError(error);
    }
  }, [_persistToken]);

  const loginWithCredentials = useCallback(async (identifier: string, password: string): Promise<true | 401 | string> => {
    try {
      const { access_token } = await authApi.login(identifier, password);
      _persistToken(access_token);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) return 401;
      }
      return handleApiError(error);
    }
  }, [_persistToken]);

  const registerWithOnboarding = useCallback(async (
    onboardingToken: string,
    username: string,
    email: string,
    password: string,
  ): Promise<true | string> => {
    try {
      const { access_token } = await authApi.register(onboardingToken, username, email, password);
      _persistToken(access_token);
      return true;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  }, [_persistToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('eyesight_token');
    apiClient.clearCache();
    setToken(null);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        currentUser,
        loginWithStravaCode,
        loginWithCredentials,
        registerWithOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


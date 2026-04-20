import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, apiClient } from '@/services/api';
import type { CurrentUser } from '@/types';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  loginWithStravaCode: (code: string) => Promise<true | 403 | string>;
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
    if (!payload.sub || !payload.role) return null;
    return { sub: String(payload.sub), role: payload.role, username: payload.username };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and restore token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('eyesight_token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setCurrentUser(decodeUser(storedToken));
    } else {
      localStorage.removeItem('eyesight_token');
    }
    setIsLoading(false);
  }, []);

  const loginWithStravaCode = useCallback(async (code: string): Promise<true | 403 | string> => {
    try {
      const { access_token } = await authApi.exchangeStravaCode(code);
      localStorage.setItem('eyesight_token', access_token);
      setToken(access_token);
      setCurrentUser(decodeUser(access_token));
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) return 403;
        if (axiosError.response?.status && axiosError.response.status >= 500) {
          return 'Erreur serveur, veuillez réessayer';
        }
      }
      if (error instanceof Error && error.message === 'Network Error') {
        return 'Impossible de contacter le serveur';
      }
      return 'Erreur de connexion';
    }
  }, []);

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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


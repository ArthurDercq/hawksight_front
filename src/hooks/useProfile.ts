import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { UserProfile } from '@/types';

const CACHE_KEY = 'profile:me';

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(() => cache.get<UserProfile>(CACHE_KEY));
  const [isLoading, setIsLoading] = useState(() => cache.get<UserProfile>(CACHE_KEY) === null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);

    try {
      const { data } = await cache.fetch<UserProfile>(CACHE_KEY, () => profileApi.getProfile(), {
        onBackground: (fresh) => setProfile(fresh),
      });
      setProfile(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('Error fetching profile — status:', axiosErr?.response?.status, 'data:', axiosErr?.response?.data, 'msg:', axiosErr?.message);
      setError('Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}

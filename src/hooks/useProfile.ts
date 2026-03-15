import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/services/api';
import type { UserProfile } from '@/types';

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await profileApi.getProfile();
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

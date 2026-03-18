import { useState, useEffect, useCallback, useRef } from 'react';
import { cache } from '@/services/cache';

interface UseQueryOptions {
  ttl?: number;
  enabled?: boolean;
}

interface UseQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: (force?: boolean) => void;
}

/**
 * Hook générique SWR wrappant cache.fetch().
 *
 * - Premier rendu : seed depuis cache.get() (affichage immédiat des stales)
 * - useEffect : cache.fetch() → fromCache=true → isRefetching, fromCache=false → isLoading
 * - Background listener : met à jour data quand le refresh silencieux se termine
 * - refetch(force=true) : ignore TTL, force un vrai fetch réseau
 * - Écoute "activities-updated" pour se rafraîchir automatiquement
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions
): UseQueryReturn<T> {
  const { ttl, enabled = true } = options ?? {};

  const [data, setData] = useState<T | null>(() => cache.get<T>(key));
  const [isLoading, setIsLoading] = useState(() => cache.get<T>(key) === null && enabled);
  const [isRefetching, setIsRefetching] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const run = useCallback(async (force = false) => {
    if (!enabled) return;

    try {
      const result = await cache.fetch<T>(key, fetcher, {
        ttl,
        force,
        onBackground: (fresh) => {
          if (isMounted.current) {
            setData(fresh);
            setIsRefetching(false);
          }
        },
      });

      if (!isMounted.current) return;

      if (result.fromCache) {
        // Données stale affichées immédiatement, background refresh en cours
        setData(result.data);
        setIsLoading(false);
        setIsRefetching(true);
      } else {
        // Données fraîches (cache absent/expiré ou force=true)
        setData(result.data);
        setIsLoading(false);
        setIsRefetching(false);
      }
    } catch (err) {
      console.error(`useQuery error [${key}]:`, err);
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [key, fetcher, ttl, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  const refetch = useCallback((force = true) => {
    if (force) cache.invalidate(key);
    run(force);
  }, [key, run]);

  useEffect(() => {
    const handler = () => refetch(true);
    window.addEventListener('activities-updated', handler);
    return () => window.removeEventListener('activities-updated', handler);
  }, [refetch]);

  return { data, isLoading, isRefetching, refetch };
}

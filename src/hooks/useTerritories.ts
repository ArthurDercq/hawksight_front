import { useState, useEffect, useRef } from 'react';
import { explorationApi } from '@/services/api';
import type { TerritoryLargest, TerritoryUnexplored } from '@/types';

interface UseTerritoriasReturn {
  largest: TerritoryLargest[];
  unexplored: TerritoryUnexplored[];
  isLoading: boolean;
  isComputing: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15; // ~1 min max

export function useTerritories(): UseTerritoriasReturn {
  const [largest, setLargest] = useState<TerritoryLargest[]>([]);
  const [unexplored, setUnexplored] = useState<TerritoryUnexplored[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [largestRes, unexploredRes] = await Promise.all([
          explorationApi.getLargestTerritories(3),
          explorationApi.getUnexploredZones(10),
        ]);

        if (cancelled) return;

        // Both ready
        setLargest(largestRes);
        setUnexplored(unexploredRes);
        setIsComputing(false);
        setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;

        // 202 = computing, poll again
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 202 && pollCount.current < MAX_POLLS) {
          pollCount.current += 1;
          setIsLoading(false);
          setIsComputing(true);
          pollTimer.current = setTimeout(fetchAll, POLL_INTERVAL_MS);
        } else {
          console.error('Error fetching territories:', err);
          setError('Erreur lors du chargement des territoires');
          setIsLoading(false);
          setIsComputing(false);
        }
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  return { largest, unexplored, isLoading, isComputing, error };
}

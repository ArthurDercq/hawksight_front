import { useState, useEffect, useCallback, useMemo } from 'react';
import { eventsApi } from '@/services/api';
import type { TrainingEvent, EventFormData } from '@/types';

interface UseEventsReturn {
  events: TrainingEvent[];
  upcomingEvents: TrainingEvent[];
  pastEvents: TrainingEvent[];
  nextEvent: TrainingEvent | null;
  isLoading: boolean;
  error: string | null;
  mutationError: string | null;
  refetch: () => void;
  createEvent: (data: EventFormData) => Promise<boolean>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  markCompleted: (id: string, done: boolean) => Promise<boolean>;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (cancelled?: { current: boolean }, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getEvents();
      if (cancelled?.current) return;
      setEvents(data);
    } catch (err) {
      if (cancelled?.current) return;
      console.error('Error fetching events:', err);
      setError('Erreur lors du chargement des événements');
    } finally {
      if (!cancelled?.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchEvents(cancelled);
    const onUpdate = () => fetchEvents(undefined, true);
    window.addEventListener('events-updated', onUpdate);
    return () => {
      cancelled.current = true;
      window.removeEventListener('events-updated', onUpdate);
    };
  }, [fetchEvents]);

  const refetch = useCallback(() => fetchEvents(), [fetchEvents]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events, today]
  );

  const pastEvents = useMemo(
    () =>
      events
        .filter(e => new Date(e.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events, today]
  );

  const nextEvent = upcomingEvents[0] ?? null;

  const createEvent = useCallback(async (data: EventFormData): Promise<boolean> => {
    setMutationError(null);
    try {
      await eventsApi.createEvent(data);
      await fetchEvents(undefined, true);
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as { response?: { status?: number } };
        if (apiErr.response?.status === 403) {
          setMutationError('Fonctionnalité non disponible en mode démo');
          return false;
        }
      }
      setMutationError('Erreur lors de la création de l\'événement');
      return false;
    }
  }, [fetchEvents]);

  const updateEvent = useCallback(async (id: string, data: Partial<EventFormData>): Promise<boolean> => {
    setMutationError(null);
    try {
      await eventsApi.updateEvent(id, data);
      await fetchEvents(undefined, true);
      return true;
    } catch {
      setMutationError('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setMutationError(null);
    try {
      await eventsApi.deleteEvent(id);
      await fetchEvents(undefined, true);
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as { response?: { status?: number } };
        if (apiErr.response?.status === 403) {
          setMutationError('Fonctionnalité non disponible en mode démo');
          return false;
        }
      }
      setMutationError('Erreur lors de la suppression');
      return false;
    }
  }, [fetchEvents]);

  const markCompleted = useCallback(async (id: string, done: boolean): Promise<boolean> => {
    setMutationError(null);
    try {
      await eventsApi.markCompleted(id, done);
      await fetchEvents(undefined, true);
      return true;
    } catch {
      setMutationError('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchEvents]);

  return {
    events,
    upcomingEvents,
    pastEvents,
    nextEvent,
    isLoading,
    error,
    mutationError,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    markCompleted,
  };
}

/**
 * QueryCache — mini React Query maison
 *
 * Comportement garanti :
 *   cache valide   → retourner immédiatement (fromCache: true) + refetch background silencieux
 *   cache expiré   → fetch, retourner promesse (fromCache: false), afficher stale pendant l'attente
 *   in-flight      → réutiliser la promesse existante
 *   force: true    → ignorer TTL, forcer un vrai refetch
 *
 * API publique :
 *   cache.get(key)                        → valeur ou null si absente/expirée
 *   cache.fetch(key, fetcher, opts?)      → { data, fromCache } — cœur du système
 *   cache.invalidate(key)                 → supprime store + in-flight
 *   cache.invalidateByPrefix(prefix)
 *   cache.invalidateAll()
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface FetchOptions {
  ttl?: number;
  force?: boolean;
}

interface FetchResult<T> {
  data: T;
  fromCache: boolean;
}

// Background listeners: key → set of callbacks appelés quand le background fetch se termine
type BackgroundCallback<T> = (data: T) => void;

class QueryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private bgListeners = new Map<string, Set<BackgroundCallback<unknown>>>();

  // ── Lecture simple ──────────────────────────────────────────────────────────

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  // ── Invalidation ────────────────────────────────────────────────────────────

  invalidate(key: string): void {
    this.store.delete(key);
    this.inFlight.delete(key);
    this.bgListeners.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) this.inFlight.delete(key);
    }
    for (const key of this.bgListeners.keys()) {
      if (key.startsWith(prefix)) this.bgListeners.delete(key);
    }
  }

  invalidateAll(): void {
    this.store.clear();
    this.inFlight.clear();
    this.bgListeners.clear();
  }

  // ── Cœur : fetch avec SWR + dedupe ─────────────────────────────────────────

  /**
   * fetch() — point d'entrée unique pour tous les hooks.
   *
   * Cas 1 — force: true
   *   Ignore le cache, lance un fetch immédiat, retourne { data, fromCache: false }
   *
   * Cas 2 — in-flight existant (et pas force)
   *   Réutilise la promesse en cours, retourne { data, fromCache: false }
   *
   * Cas 3 — cache valide (et pas force)
   *   Retourne { data, fromCache: true } immédiatement.
   *   Lance en parallèle un background fetch (dedupliqué).
   *   Quand le background se termine, notifie tous les listeners via onBackground.
   *
   * Cas 4 — cache expiré ou absent
   *   Lance un fetch, retourne { data, fromCache: false }
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: FetchOptions & { onBackground?: BackgroundCallback<T> }
  ): Promise<FetchResult<T>> {
    const ttl = options?.ttl ?? DEFAULT_TTL_MS;
    const force = options?.force ?? false;
    const onBackground = options?.onBackground;

    // Cas 1 : force → ignorer cache et in-flight
    if (force) {
      this.inFlight.delete(key);
      this.bgListeners.delete(key);
      const data = await this._doFetch(key, fetcher, ttl);
      return { data, fromCache: false };
    }

    // Cas 2 : in-flight existant → réutiliser
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      if (onBackground) this._addBgListener(key, onBackground as BackgroundCallback<unknown>);
      const data = await existing;
      return { data, fromCache: false };
    }

    // Cas 3 : cache valide → retourner immédiatement + lancer background
    const cached = this.get<T>(key);
    if (cached !== null) {
      // Enregistrer le listener background avant de lancer
      if (onBackground) this._addBgListener(key, onBackground as BackgroundCallback<unknown>);
      // Lancer le background refresh (non bloquant)
      this._launchBackground(key, fetcher, ttl);
      return { data: cached, fromCache: true };
    }

    // Cas 4 : absent ou expiré → fetch normal
    if (onBackground) this._addBgListener(key, onBackground as BackgroundCallback<unknown>);
    const data = await this._doFetch(key, fetcher, ttl);
    return { data, fromCache: false };
  }

  // ── Helpers internes ────────────────────────────────────────────────────────

  private _doFetch<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const promise = fetcher().then((data) => {
      this.set(key, data, ttl);
      this.inFlight.delete(key);
      // Notifier les background listeners
      this._notifyBgListeners(key, data);
      return data;
    }).catch((err) => {
      this.inFlight.delete(key);
      throw err;
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  private _launchBackground<T>(key: string, fetcher: () => Promise<T>, ttl: number): void {
    // Ne pas relancer si déjà in-flight
    if (this.inFlight.has(key)) return;
    this._doFetch(key, fetcher, ttl).catch(() => {
      // Background failure silencieuse — les données stales restent affichées
    });
  }

  private _addBgListener<T>(key: string, cb: BackgroundCallback<T>): void {
    if (!this.bgListeners.has(key)) {
      this.bgListeners.set(key, new Set());
    }
    this.bgListeners.get(key)!.add(cb as BackgroundCallback<unknown>);
  }

  private _notifyBgListeners<T>(key: string, data: T): void {
    const listeners = this.bgListeners.get(key);
    if (!listeners) return;
    listeners.forEach(cb => cb(data));
    this.bgListeners.delete(key);
  }

  // ── Compat : dedupe() conservé pour ne pas casser d'éventuels usages ───────
  /** @deprecated Utiliser fetch() à la place */
  async dedupe<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    return this._doFetch(key, fetcher, ttlMs);
  }
}

export const cache = new QueryCache();

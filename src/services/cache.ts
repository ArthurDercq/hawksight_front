/**
 * In-memory cache with TTL + in-flight request deduplication.
 *
 * - cache.get(key)            → cached value or null if missing/expired
 * - cache.set(key, data, ttl) → store value with TTL in ms (default 5min)
 * - cache.invalidate(key)     → remove one entry
 * - cache.invalidateAll()     → wipe everything (e.g. after sync)
 * - cache.dedupe(key, fn)     → run fn() once even if called concurrently;
 *                               subsequent callers receive the same Promise
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

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

  invalidate(key: string): void {
    this.store.delete(key);
    // Also cancel in-flight tracking so next call fetches fresh
    this.inFlight.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) this.inFlight.delete(key);
    }
  }

  invalidateAll(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  /**
   * Deduplicate concurrent fetches for the same key.
   * If a fetch for `key` is already in flight, return its Promise instead of
   * starting a new one. Does NOT short-circuit on cache hit — callers decide
   * whether to read cache first. Once resolved, result is stored in cache.
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
    // Return existing in-flight promise if one exists (dedup only)
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    // Start new fetch, register it, then clean up
    const promise = fetcher().then((data) => {
      this.set(key, data, ttlMs);
      this.inFlight.delete(key);
      return data;
    }).catch((err) => {
      this.inFlight.delete(key);
      throw err;
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Stale-While-Revalidate: calls onCached immediately with stale data (if any),
   * then always fetches fresh data in background and calls onFresh when ready.
   * Deduplicates concurrent fetches for the same key.
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    onCached: (data: T) => void,
    onFresh: (data: T) => void,
    ttlMs = DEFAULT_TTL_MS
  ): Promise<void> {
    const cached = this.get<T>(key);
    if (cached !== null) onCached(cached);

    // Always fetch fresh in background (deduped)
    try {
      const fresh = await this.dedupe(key, fetcher, ttlMs);
      onFresh(fresh);
    } catch (err) {
      // Fresh fetch failed — stale data (if any) remains displayed
      throw err;
    }
  }
}

export const cache = new MemoryCache();

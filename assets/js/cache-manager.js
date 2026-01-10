/**
 * CacheManager - Système de cache frontend avec TTL
 * Utilise Map en mémoire + sessionStorage comme fallback
 */
class CacheManager {
    constructor(defaultTTL = 300000) { // 5 minutes par défaut
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        this.debug = window.DEBUG_CHARTS || false;
    }

    /**
     * Stocke une valeur dans le cache avec TTL
     * @param {string} key - Clé du cache
     * @param {*} value - Valeur à mettre en cache
     * @param {number} ttl - Time to live en millisecondes
     */
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        const cacheEntry = { value, expiry };

        this.cache.set(key, cacheEntry);

        // Backup dans sessionStorage
        try {
            sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
            if (this.debug) {
                console.log(`[Cache] SET: ${key} (TTL: ${ttl}ms)`);
            }
        } catch (e) {
            // Ignore si quota dépassé
            if (this.debug) {
                console.warn(`[Cache] SessionStorage quota exceeded for: ${key}`);
            }
        }
    }

    /**
     * Récupère une valeur du cache
     * @param {string} key - Clé du cache
     * @returns {*} La valeur en cache ou null si expirée/inexistante
     */
    get(key) {
        let cached = this.cache.get(key);

        // Si pas en mémoire, chercher dans sessionStorage
        if (!cached) {
            try {
                const stored = sessionStorage.getItem(`cache_${key}`);
                if (stored) {
                    cached = JSON.parse(stored);
                    this.cache.set(key, cached);
                }
            } catch (e) {
                if (this.debug) {
                    console.warn(`[Cache] Error reading from sessionStorage: ${key}`);
                }
                return null;
            }
        }

        if (!cached) {
            if (this.debug) {
                console.log(`[Cache] MISS: ${key}`);
            }
            return null;
        }

        // Vérifier expiration
        if (Date.now() > cached.expiry) {
            this.delete(key);
            if (this.debug) {
                console.log(`[Cache] EXPIRED: ${key}`);
            }
            return null;
        }

        if (this.debug) {
            console.log(`[Cache] HIT: ${key}`);
        }
        return cached.value;
    }

    /**
     * Supprime une entrée du cache
     * @param {string} key - Clé à supprimer
     */
    delete(key) {
        this.cache.delete(key);
        sessionStorage.removeItem(`cache_${key}`);
        if (this.debug) {
            console.log(`[Cache] DELETE: ${key}`);
        }
    }

    /**
     * Vide tout le cache
     */
    clear() {
        this.cache.clear();

        // Nettoyer sessionStorage
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                sessionStorage.removeItem(key);
            }
        });

        if (this.debug) {
            console.log('[Cache] CLEAR ALL');
        }
    }

    /**
     * Génère une clé de cache à partir d'URL et paramètres
     * @param {string} url - URL de base
     * @param {Object} params - Paramètres additionnels
     * @returns {string} Clé de cache unique
     */
    generateKey(url, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(k => `${k}=${params[k]}`)
            .join('&');

        return sortedParams ? `${url}?${sortedParams}` : url;
    }

    /**
     * Invalide toutes les clés correspondant à un pattern
     * @param {string|RegExp} pattern - Pattern à matcher
     */
    invalidatePattern(pattern) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

        // Invalider dans Map
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }

        // Invalider dans sessionStorage
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('cache_') && regex.test(key.substring(6))) {
                sessionStorage.removeItem(key);
            }
        });

        if (this.debug) {
            console.log(`[Cache] INVALIDATE PATTERN: ${pattern}`);
        }
    }

    /**
     * Retourne les statistiques du cache
     * @returns {Object} Stats
     */
    getStats() {
        const memorySize = this.cache.size;
        const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('cache_'));

        return {
            memoryEntries: memorySize,
            sessionEntries: sessionKeys.length,
            totalSize: this._estimateSize()
        };
    }

    /**
     * Estime la taille du cache en octets
     * @private
     */
    _estimateSize() {
        let size = 0;
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                size += key.length + sessionStorage.getItem(key).length;
            }
        });
        return size;
    }
}

// Instance globale
const chartCache = new CacheManager();

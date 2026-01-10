/**
 * ChartLazyLoader - Lazy loading des graphiques avec Intersection Observer
 * Charge les graphiques uniquement quand ils deviennent visibles
 */
class ChartLazyLoader {
    constructor() {
        this.observers = new Map();
        this.loadedCharts = new Set();
        this.pendingLoads = new Map();
        this.debug = window.DEBUG_CHARTS || false;

        // Vérifier si Intersection Observer est supporté
        this.isSupported = 'IntersectionObserver' in window;

        if (!this.isSupported && this.debug) {
            console.warn('[LazyLoader] IntersectionObserver not supported, falling back to immediate loading');
        }
    }

    /**
     * Observer un conteneur pour charger son graphique quand visible
     * @param {string} containerId - ID du conteneur à observer
     * @param {Function} loadFunction - Fonction à exécuter pour charger le graphique
     * @param {Object} options - Options de l'IntersectionObserver
     */
    observe(containerId, loadFunction, options = {}) {
        // Si déjà chargé, ignorer
        if (this.loadedCharts.has(containerId)) {
            if (this.debug) {
                console.log(`[LazyLoader] Already loaded: ${containerId}`);
            }
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            if (this.debug) {
                console.warn(`[LazyLoader] Container not found: ${containerId}`);
            }
            return;
        }

        // Si IntersectionObserver non supporté, charger immédiatement
        if (!this.isSupported) {
            this._executeLoad(containerId, loadFunction);
            return;
        }

        const observerOptions = {
            root: options.root || null,
            rootMargin: options.rootMargin || '100px', // Précharger 100px avant
            threshold: options.threshold || 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.loadedCharts.has(containerId)) {
                    this._executeLoad(containerId, loadFunction);
                    observer.disconnect();
                }
            });
        }, observerOptions);

        observer.observe(container);
        this.observers.set(containerId, observer);

        if (this.debug) {
            console.log(`[LazyLoader] Observing: ${containerId}`);
        }
    }

    /**
     * Observer plusieurs conteneurs en parallèle
     * @param {Array} configs - Array de {id, fn, options}
     */
    observeAll(configs) {
        configs.forEach(config => {
            this.observe(config.id, config.fn, config.options);
        });
    }

    /**
     * Exécute le chargement d'un graphique
     * @private
     */
    async _executeLoad(containerId, loadFunction) {
        // Éviter les chargements multiples simultanés
        if (this.pendingLoads.has(containerId)) {
            if (this.debug) {
                console.log(`[LazyLoader] Load already pending: ${containerId}`);
            }
            return;
        }

        this.pendingLoads.set(containerId, true);

        try {
            if (this.debug) {
                console.log(`[LazyLoader] Loading: ${containerId}`);
            }

            await loadFunction();

            this.loadedCharts.add(containerId);
            this.pendingLoads.delete(containerId);

            if (this.debug) {
                console.log(`[LazyLoader] Loaded: ${containerId}`);
            }
        } catch (error) {
            this.pendingLoads.delete(containerId);
            console.error(`[LazyLoader] Error loading ${containerId}:`, error);
        }
    }

    /**
     * Force le chargement immédiat d'un graphique
     * @param {string} containerId - ID du conteneur
     */
    forceLoad(containerId) {
        const observer = this.observers.get(containerId);
        if (observer) {
            observer.disconnect();
            this.observers.delete(containerId);
        }

        // Trouver la fonction de chargement stockée
        const container = document.getElementById(containerId);
        if (container && container._lazyLoadFn) {
            this._executeLoad(containerId, container._lazyLoadFn);
        }
    }

    /**
     * Réinitialise un graphique pour permettre un rechargement
     * @param {string} containerId - ID du conteneur
     */
    reset(containerId) {
        this.loadedCharts.delete(containerId);
        this.pendingLoads.delete(containerId);

        const observer = this.observers.get(containerId);
        if (observer) {
            observer.disconnect();
            this.observers.delete(containerId);
        }

        if (this.debug) {
            console.log(`[LazyLoader] Reset: ${containerId}`);
        }
    }

    /**
     * Réinitialise tous les graphiques
     */
    resetAll() {
        this.loadedCharts.clear();
        this.pendingLoads.clear();

        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        if (this.debug) {
            console.log('[LazyLoader] Reset all');
        }
    }

    /**
     * Vérifie si un graphique est chargé
     * @param {string} containerId - ID du conteneur
     * @returns {boolean}
     */
    isLoaded(containerId) {
        return this.loadedCharts.has(containerId);
    }

    /**
     * Retourne les statistiques du loader
     * @returns {Object}
     */
    getStats() {
        return {
            observed: this.observers.size,
            loaded: this.loadedCharts.size,
            pending: this.pendingLoads.size,
            supported: this.isSupported
        };
    }
}

// Instance globale
const chartLoader = new ChartLazyLoader();

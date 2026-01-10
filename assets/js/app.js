// Configuration de l'API backend
// Priorité:
// 1. Variable d'environnement (pour production)
// 2. Détection automatique selon le port (pour développement)
const API_BASE = window.ENV?.API_BASE_URL || (
    window.location.port === '3000'
        ? 'http://localhost:3000/api'  // Docker Compose avec nginx proxy
        : 'http://localhost:8000'       // Dev local direct
);
let currentToken = null;
let currentPage = 'homePage';
let charts = {};

// Palette de couleurs HawkSight
const COLORS = {
    charcoal: '#0B0C10',
    steel: '#3A3F47',
    mist: '#F2F2F2',
    amber: '#E8832A',
    amberLight: '#ff9942',
    glacier: '#3DB2E0',
    moss: '#6DAA75'
};

// Configuration globale Chart.js pour le thème sombre
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = COLORS.mist;
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.font.family = "'Inter', sans-serif";
}

// ===== OPTIMISATIONS PERFORMANCES =====

/**
 * Fetch avec cache automatique
 * @param {string} url - URL à fetcher
 * @param {Object} options - Options du fetch
 * @param {number} cacheTTL - Durée de vie du cache en ms (défaut: 5 min)
 * @returns {Promise} Données de l'API
 */
async function fetchWithCache(url, options = {}, cacheTTL = 300000) {
    const cacheKey = chartCache.generateKey(url, {});

    const cached = chartCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    chartCache.set(cacheKey, data, cacheTTL);

    return data;
}

/**
 * Met à jour ou crée un graphique Chart.js
 * Réutilise l'instance existante au lieu de destroy/create
 * @param {string} chartKey - Clé du graphique dans l'objet global charts
 * @param {string} canvasId - ID du canvas HTML
 * @param {Object} config - Configuration Chart.js
 * @param {Object} data - Données du graphique
 */
function updateOrCreateChart(chartKey, canvasId, config, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (charts[chartKey]) {
        Object.assign(charts[chartKey].data, data);
        charts[chartKey].update('none');
    } else {
        charts[chartKey] = new Chart(ctx, {
            ...config,
            data: data
        });
    }
}

/**
 * Invalidation du cache lors de changements de filtres ou refresh
 */
function clearChartCache() {
    chartCache.clear();
}

/**
 * Invalidation du cache lors de la déconnexion
 */
function clearCacheOnLogout() {
    chartCache.clear();
    chartLoader.resetAll();
}

// ===== FIN OPTIMISATIONS =====

// Gestion de l'état de l'application
function showPage(pageId) {
    // Pages publiques accessibles sans authentification
    const publicPages = ['homePage', 'loginPage'];

    // Vérifier l'authentification pour les pages protégées
    if (!publicPages.includes(pageId)) {
        if (!validateToken()) {
            // Si pas authentifié, rediriger vers la page de connexion
            showPage('loginPage');
            return;
        }
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    updateNavigation();

    // Charger les KPI quand on accède à la page Chiffres clés
    if (pageId === 'kpiPage') {
        loadKPIsWithFilter();
    }

    // Charger le calendrier quand on accède à la page Calendrier
    if (pageId === 'calendarPage') {
        loadCalendar();
    }

    // Charger les activités quand on accède à la page Activités
    if (pageId === 'activitiesPage') {
        loadActivities();
    }

    // Charger le profil quand on accède à la page Profil
    if (pageId === 'profilePage') {
        initProfilePage();
    }
}

function updateNavigation() {
    const navButtons = document.getElementById('navButtons');
    const currentPage = document.querySelector('.page.active').id;

    navButtons.innerHTML = '';

    if (currentToken) {
        // Navigation items avec icônes Lucide
        const navItems = [
            {
                id: 'activitiesPage',
                label: 'Activités',
                icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
            },
            {
                id: 'kpiPage',
                label: 'Chiffres clés',
                icon: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'
            },
            {
                id: 'calendarPage',
                label: 'Calendrier',
                icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
            }
        ];

        let buttonsHtml = '';
        navItems.forEach(item => {
            const isActive = currentPage === item.id;
            buttonsHtml += `
                <button class="nav-item ${isActive ? 'active' : ''}" onclick="showPage('${item.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${item.icon}
                    </svg>
                    <span>${item.label}</span>
                </button>
            `;
        });

        // Dropdown Paramètres
        buttonsHtml += `
            <div class="dropdown">
                <button class="nav-item dropdown-toggle ${currentPage === 'profilePage' ? 'active' : ''}" onclick="toggleDropdown(event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>Paramètres</span>
                </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" onclick="showPage('profilePage')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Profil
                    </a>
                    <a class="dropdown-item dropdown-item-danger" onclick="logout()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Déconnexion
                    </a>
                </div>
            </div>
        `;

        navButtons.innerHTML = buttonsHtml;

        if (currentPage === 'homePage') {
            showPage('dashboardPage');
        }
    } else {
        navButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="showPage('homePage')">Accueil</button>
            <button class="btn btn-primary" onclick="showLogin()">Se connecter</button>
        `;
    }
}

function showLogin() {
    showPage('loginPage');
}

// Authentification
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const statusEl = document.getElementById('loginStatus');

    statusEl.innerHTML = '<div class="status-message loading">Connexion en cours...</div>';

    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            setSecureToken(data.access_token);
            statusEl.innerHTML = '<div class="status-message success">Connexion réussie!</div>';

            // Mettre à jour automatiquement les données en arrière-plan
            autoUpdateData();

            setTimeout(() => {
                showPage('dashboardPage');
                loadDashboard();
            }, 1000);
        } else {
            statusEl.innerHTML = '<div class="status-message error">Identifiants incorrects</div>';
        }
    } catch (error) {
        statusEl.innerHTML = '<div class="status-message error">Erreur de connexion</div>';
    }
}

function logout() {
    currentToken = null;
    localStorage.removeItem('eyesight_token');
    showPage('homePage');
}

// Mise à jour automatique et silencieuse de la base de données
async function autoUpdateData() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Mettre à jour la base de données
        await fetch(`${API_BASE}/activities/update_db`, {
            method: 'POST',
            headers: headers
        });

        // Mettre à jour les streams (avec timeout de 30 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            await fetch(`${API_BASE}/activities/update_streams`, {
                method: 'POST',
                headers: headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (error) {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        // Silent error handling in production
    }
}

// Utilitaires API
function getAuthHeaders() {
    if (!currentToken || isTokenExpired()) {
        return null;
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
}

function isTokenExpired() {
    if (!currentToken) return true;
    try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

function setSecureToken(token) {
    currentToken = token;
    localStorage.setItem('eyesight_token', token);
}

function validateToken() {
    const token = localStorage.getItem('eyesight_token');
    if (!token || isTokenExpired()) {
        logout();
        return false;
    }
    currentToken = token;
    return true;
}

// Chargement du dashboard
async function loadDashboard() {
    await loadKPIsWithFilter();
    await loadLastActivity();
    await loadAnalytics();
}

// Variables globales pour les analyses
let currentWeekOffset = 0;
let currentWeeklyOffset = 0;

// Chargement des analyses
async function loadAnalytics() {
    // Charger immédiatement les éléments visibles (au-dessus du scroll)
    loadGoals();
    updateMonthlySummary();
    updateWeeklySummaryData();
    loadStreak();
    loadRecords();

    // Lazy load des graphiques avec Intersection Observer
    chartLoader.observe('dailyHoursChart', loadDailyHours);
    chartLoader.observe('weeklyHoursChart', loadWeeklyHours);
    chartLoader.observe('weeklyDistanceChart', loadWeeklyDistance);
    chartLoader.observe('repartitionChart', loadRepartition);
    chartLoader.observe('weeklyPaceChart', loadWeeklyPace);
}

async function loadKPIs() {
    try {
        const response = await fetch(`${API_BASE}/kpi/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayKPIs(data.kpis);
        }
    } catch (error) {
        console.error('Erreur chargement KPIs:', error);
    }
}

async function loadKPIsWithFilter() {
    const year = document.getElementById('yearFilter').value;

    let query = '';
    if (year) {
        query = `?start_date=${year}-01-01&end_date=${year}-12-31`;
    }

    try {
        const response = await fetch(`${API_BASE}/kpi/${query}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayKPIs(data.kpis);
        }
    } catch (error) {
        console.error('Erreur chargement KPIs filtrés :', error);
    }
}


function displayKPIs(kpis) {
    const container = document.getElementById('kpiContainer');
    container.innerHTML = '';

    const kpiConfig = {
        total_km_run: {
            unit: 'km',
            label: 'Course à pied',
            metric: 'run',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
        },
        total_km_trail: {
            unit: 'km',
            label: 'Trail',
            metric: 'trail',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 18v-1"/><path d="M16 18v-3"/></svg>`
        },
        total_km_bike: {
            unit: 'km',
            label: 'Vélo',
            metric: 'bike',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
        },
        total_km_swim: {
            unit: 'km',
            label: 'Natation',
            metric: 'swim',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16s.9 1 2 1c1.1 0 2-.9 2-.9s1.1-1 2-1 2 1 2 1 .9 1 2 1 2-1 2-1 1.1-1 2-1 2 1 2 1 .9 1 2 1 2-1 2-1"/><path d="M2 12s.9 1 2 1c1.1 0 2-.9 2-.9s1.1-1 2-1 2 1 2 1 .9 1 2 1 2-1 2-1 1.1-1 2-1 2 1 2 1 .9 1 2 1 2-1 2-1"/><path d="M20 4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/></svg>`
        },
        total_hours: {
            unit: 'h',
            label: 'Sport',
            metric: 'hours',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
        },
        total_dplus_run_trail: {
            unit: 'm',
            label: 'dénivelé en courant',
            metric: 'elevation',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`
        },
        total_dplus_bike: {
            unit: 'm',
            label: 'dénivelé à vélo',
            metric: 'elevation',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`
        }
    };

    // Liste des KPIs à afficher (exclure ceux non souhaités)
    const kpisToDisplay = [
        'total_km_run',
        'total_km_trail',
        'total_km_bike',
        'total_km_swim',
        'total_hours',
        'total_dplus_run_trail',
        'total_dplus_bike'
    ];

    const formatNumber = (num) => {
        // Arrondir vers le haut tous les chiffres
        const roundedNum = Math.ceil(num);
        const formatted = new Intl.NumberFormat('fr-FR').format(roundedNum);
        // Remplacer l'espace (séparateur de milliers français) par un point
        return formatted.replace(/\s/g, '.');
    };

    // Afficher uniquement les KPIs sélectionnés
    kpisToDisplay.forEach((key) => {
        if (kpis[key] === undefined || kpis[key] === null) return;

        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        const value = kpis[key];
        const displayValue = formatNumber(value);
        const config = kpiConfig[key];

        metricCard.setAttribute('data-metric', config.metric);

        metricCard.innerHTML = `
            <div class="metric-corner"></div>
            <div class="metric-header">
                <div class="metric-icon">${config.icon}</div>
                <div class="metric-label">${config.label}</div>
            </div>
            <div class="metric-value">
                ${displayValue}<span class="metric-unit">${config.unit}</span>
            </div>
            <div class="metric-indicators">
                <div class="metric-dot"></div>
                <div class="metric-dot"></div>
                <div class="metric-dot"></div>
                <div class="metric-dot"></div>
            </div>
            <div class="metric-progress">
                <div class="metric-progress-bar"></div>
            </div>
        `;

        // Track mouse position for glow effect
        metricCard.addEventListener('mousemove', (e) => {
            const rect = metricCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            metricCard.style.setProperty('--mouse-x', `${x}px`);
            metricCard.style.setProperty('--mouse-y', `${y}px`);
        });

        container.appendChild(metricCard);
    });

    // ==========================
    // Graphique horizontal : nombre d'activités par sport
    // ==========================
    if (kpis["nombre d'activités par sport"]) {
        const chartContainer = document.getElementById('activityCountChartContainer');
        chartContainer.innerHTML = '';

        if (charts.activityCount) {
            charts.activityCount.destroy();
        }

        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        const value = kpis["nombre d'activités par sport"];
        const sports = ["Run", "Bike", "Trail", "WeightTraining", "Hike", "Swim"];
        const labels = [];
        const counts = [];

        // Palette de couleurs identique au graphique "Heures d'activité par jour"
        const sportColors = {
            'Run': '#3DB2E0',        // Bleu glacier (charte graphique)
            'Trail': '#1E6A8F',      // Bleu glacier beaucoup plus foncé
            'Bike': '#7B6BC8',       // Violet nuancé bleu
            'Swim': '#8B92A0',       // Gris clair
            'WeightTraining': '#9477D9', // Violet nuancé
            'Hike': '#5A5F6C'        // Gris foncé
        };

        const backgroundColors = [];

        sports.forEach(sport => {
            if (value[sport] !== undefined) {
                labels.push(sport);
                counts.push(value[sport]);
                backgroundColors.push(sportColors[sport] || COLORS.glacier);
            }
        });

        charts.activityCount = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nombre d\'activités',
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: {
                            callback: function(val) {
                                return new Intl.NumberFormat('fr-FR').format(val);
                            }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { mirror: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return new Intl.NumberFormat('fr-FR').format(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
}





// Chargement de la dernière activité
async function loadLastActivity(sportType = null) {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Si sportType est vide ou null, ne pas ajouter le paramètre (pour obtenir la dernière activité tous sports confondus)
        const url = sportType
            ? `${API_BASE}/activities/last_activity?sport_type=${encodeURIComponent(sportType)}`
            : `${API_BASE}/activities/last_activity`;

        const response = await fetch(url, {
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message) {
                displayNoActivityMessage(data.message);
            } else {
                displayLastActivity(data);
                await loadActivityTrace(data);
                await loadActivityElevation(sportType);
            }
        }
    } catch (error) {
        console.error('Erreur chargement dernière activité:', error);
    }
}

async function loadLastActivityWithFilter() {
    const sportType = document.getElementById('sportFilter').value;
    // Si sportType est une chaîne vide, passer null pour obtenir la dernière activité tous sports confondus
    await loadLastActivity(sportType || null);
}

function displayNoActivityMessage(message) {
    const container = document.getElementById('lastActivityInfo');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <p>${message}</p>
        </div>
    `;

    // Vider les cartes et graphiques
    document.getElementById('lastActivityMapInteractive').innerHTML = '';
    document.getElementById('lastActivityMapStatic').innerHTML = '';
    clearElevationChart();
}

function displayLastActivity(activity) {
    const container = document.getElementById('lastActivityInfo');

    const date = new Date(activity.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    container.innerHTML = `
        <div class="activity-header" style="cursor: pointer;" onclick="showActivityDetail(${activity.id})" title="Cliquez pour voir les détails">
            <div class="activity-title">${activity.name || 'Activité'}</div>
            <div class="activity-date">${date}</div>
        </div>

        <div class="activity-info" style="cursor: pointer;" onclick="showActivityDetail(${activity.id})" title="Cliquez pour voir les détails">
            <div class="activity-stat">
                <div class="activity-stat-value" style="color: ${COLORS.amber};">${activity.distance_km.toFixed(2)} km</div>
                <div class="activity-stat-label">Distance</div>
            </div>
            <div class="activity-stat">
                <div class="activity-stat-value" style="color: ${COLORS.glacier};">${activity.duree_hms}</div>
                <div class="activity-stat-label">Temps</div>
            </div>
            <div class="activity-stat">
                <div class="activity-stat-value" style="color: ${COLORS.glacier};">${Math.round(activity.denivele_m || 0)} m</div>
                <div class="activity-stat-label">Dénivelé+</div>
            </div>
            <div class="activity-stat">
                <div class="activity-stat-value" style="color: ${COLORS.amber};">${activity.allure_min_per_km} min/km</div>
                <div class="activity-stat-label">Allure</div>
            </div>
            ${activity.bpm_moyen ? `
            <div class="activity-stat">
                <div class="activity-stat-value" style="color: ${COLORS.moss};">${Math.round(activity.bpm_moyen)} bpm</div>
                <div class="activity-stat-label">BPM moyen</div>
            </div>
            ` : ''}
        </div>
    `;

    const coords = activity.polyline_coords || [];
    if (coords.length === 0) return;

    initializeInteractiveMap(coords, activity.id);
    initializeStaticMap(coords, activity.id);
}

function initializeInteractiveMap(coords, activityId) {
    if (!mapInteractive) {
        mapInteractive = L.map('lastActivityMapInteractive', {
            zoomControl: true,
            attributionControl: false
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        }).addTo(mapInteractive);
    }

    if (polylineInteractive) {
        mapInteractive.removeLayer(polylineInteractive);
    }

    polylineInteractive = L.polyline(coords, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.9,
        lineJoin: 'round'
    }).addTo(mapInteractive);

    mapInteractive.fitBounds(polylineInteractive.getBounds(), { padding: [20, 20] });

    // Rendre la carte cliquable
    const mapContainer = document.getElementById('lastActivityMapInteractive');
    mapContainer.style.cursor = 'pointer';
    mapContainer.onclick = () => showActivityDetail(activityId);
    mapContainer.title = 'Cliquez pour voir les détails';
}

function initializeStaticMap(coords, activityId) {
    if (!mapStatic) {
        mapStatic = L.map('lastActivityMapStatic', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false
        });
    }

    if (polylineStatic) {
        mapStatic.removeLayer(polylineStatic);
    }

    polylineStatic = L.polyline(coords, {
        color: COLORS.amber,
        weight: 3,
        opacity: 1,
        lineJoin: 'round'
    }).addTo(mapStatic);

    mapStatic.fitBounds(polylineStatic.getBounds(), { padding: [20, 20] });

    // Rendre la carte cliquable
    const mapContainer = document.getElementById('lastActivityMapStatic');
    mapContainer.style.cursor = 'pointer';
    mapContainer.onclick = () => showActivityDetail(activityId);
    mapContainer.title = 'Cliquez pour voir les détails';
}


// Chargement de la trace d'activité
async function loadActivityTrace(activity) {
    try {
        // Utiliser directement les coords de l'activité
        if (activity.coords && activity.coords.length > 0) {
            displayActivityTrace(activity.coords);
        } else {
            document.getElementById('activityMap').innerHTML =
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Aucune donnée GPS disponible</div>';
        }
    } catch (error) {
        console.error('Erreur chargement trace:', error);
        document.getElementById('activityMap').innerHTML =
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc3545;">Erreur chargement trace</div>';
    }
}

function displayActivityTrace(coords) {
    const mapContainer = document.getElementById('activityMap');

    if (!coords || coords.length === 0) {
        if (mapContainer) {
            mapContainer.innerHTML =
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Aucune coordonnée GPS disponible</div>';
        }
        return;
    }

    // Les coords sont déjà au format [lat, lon]
    const validPoints = coords.filter(coord =>
        coord[0] !== null && coord[1] !== null &&
        !isNaN(coord[0]) && !isNaN(coord[1])
    );

    if (validPoints.length === 0) {
        if (mapContainer) {
            mapContainer.innerHTML =
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Aucune coordonnée GPS valide</div>';
        }
        return;
    }

    // Calculer les limites
    const lats = validPoints.map(p => p[0]);
    const lons = validPoints.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Dimensions du conteneur
    const width = 400;
    const height = 400;
    const padding = 20;

    // Fonction de projection
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;

    const scaleX = (width - 2 * padding) / (lonRange || 0.001);
    const scaleY = (height - 2 * padding) / (latRange || 0.001);
    const scale = Math.min(scaleX, scaleY);

    const projectX = lon => padding + (lon - minLon) * scale;
    const projectY = lat => height - padding - (lat - minLat) * scale;

    // Créer le SVG avec la polyline
    const pathPoints = validPoints.map(coord =>
        `${projectX(coord[1])},${projectY(coord[0])}`
    ).join(' L ');

    if (mapContainer) {
        mapContainer.innerHTML = `
            <svg class="polyline-svg" viewBox="0 0 ${width} ${height}">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <polyline
                    points="M ${pathPoints}"
                    fill="none"
                    stroke="#667eea"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <circle
                    cx="${projectX(validPoints[0][1])}"
                    cy="${projectY(validPoints[0][0])}"
                    r="6"
                    fill="#28a745"
                    stroke="#fff"
                    stroke-width="2"
                />
                <circle
                    cx="${projectX(validPoints[validPoints.length - 1][1])}"
                    cy="${projectY(validPoints[validPoints.length - 1][0])}"
                    r="6"
                    fill="#dc3545"
                    stroke="#fff"
                    stroke-width="2"
                />
            </svg>
        `;
    }
}

let mapInteractive, mapStatic;
let polylineInteractive, polylineStatic;




async function loadActivityElevation(sportType = null) {
    const headers = getAuthHeaders();
    if (!headers) {
        return;
    }

    try {
        // Si sportType est vide ou null, ne pas ajouter le paramètre
        const url = sportType
            ? `${API_BASE}/activities/last_activity_streams?sport_type=${encodeURIComponent(sportType)}`
            : `${API_BASE}/activities/last_activity_streams`;

        const data = await fetchWithCache(url, { headers }, 300000);

        if (!data.streams || data.streams.length === 0) {
            clearElevationChart();
            return;
        }

        displayElevationProfile(data.streams);

    } catch (error) {
        clearElevationChart();
    }
}

function clearElevationChart() {
    const canvas = document.getElementById('elevationChart');
    if (canvas && charts.elevation) {
        charts.elevation.destroy();
        charts.elevation = null;
    }

    const container = document.getElementById('elevationContainer');
    if (container) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucune donnée d\'élévation disponible</p>';
    }
}

function displayElevationProfile(streams) {
    // Rétablir le canvas s'il a été supprimé
    const container = document.getElementById('elevationContainer');
    if (container && !container.querySelector('#elevationChart')) {
        container.innerHTML = '<canvas id="elevationChart" width="600" height="200"></canvas>';
    }

    const canvas = document.getElementById('elevationChart');
    if (!canvas) {
        return;
    }

    const distances = streams.map(s => s.distance_m / 1000);
    const elevations = streams.map(s => s.altitude);

    // Créer des paires de données {x: distance, y: altitude}
    const dataPoints = distances.map((dist, index) => ({
        x: dist,
        y: elevations[index]
    }));

    const totalDistance = Math.max(...distances);

    // Réutiliser l'instance si elle existe
    if (charts.elevation) {
        charts.elevation.data.datasets[0].data = dataPoints;
        charts.elevation.options.scales.x.max = Math.ceil(totalDistance);
        charts.elevation.update('none');
        return;
    }

    const ctx = canvas.getContext('2d');
    charts.elevation = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Altitude (m)',
                data: dataPoints,
                borderColor: COLORS.glacier,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                backgroundColor: 'rgba(61, 178, 224, 0.2)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Distance (km)' },
                    grid: { display: false },
                    min: 0,
                    max: Math.ceil(totalDistance),
                    ticks: {
                        stepSize: 1,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function(value) {
                            return Math.round(value);
                        }
                    }
                },
                y: {
                    title: { display: true, text: 'Altitude (m)' },
                    grid: { display: false },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(0)} m à ${context.parsed.x.toFixed(2)} km`;
                        }
                    }
                }
            }
        }
    });
}




// Analyses hebdomadaires

// 1. Graphique des heures par jour de la semaine
async function loadDailyHours() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const url = `${API_BASE}/plot/daily_hours_bar?week_offset=${currentWeekOffset}`;
        const data = await fetchWithCache(url, { headers }, 300000);

        displayDailyHours(data);
        updateWeekLabel(data);

        // Mettre à jour la carte "Ce Mois" si on est sur la semaine courante
        if (currentWeekOffset === 0) {
            await updateMonthlySummary();
        }
    } catch (error) {
        console.error('Erreur chargement heures quotidiennes:', error);
    }
}

function displayDailyHours(data) {
    const canvas = document.getElementById('dailyHoursChart');
    if (!canvas) return;

    // Utiliser les données formatées du backend
    const labels = data.labels || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    // Palette de couleurs avec nuances de bleu et violet-bleu
    const sportColors = {
        'Run': '#3DB2E0',        // Bleu glacier (charte graphique)
        'Trail': '#1E6A8F',      // Bleu glacier beaucoup plus foncé
        'Bike': '#7B6BC8',       // Violet nuancé bleu
        'Swim': '#8B92A0',       // Gris clair (inchangé)
        'WeightTraining': '#9477D9', // Violet nuancé
        'Hike': '#5A5F6C'        // Gris foncé (inchangé)
    };

    // Si pas de datasets, afficher un graphique vide
    let datasets = [];
    let maxMinutes = 480; // Valeur par défaut: 8 heures = 480 minutes

    if (data.datasets && data.datasets.length > 0) {
        // Préparer les datasets pour chaque sport en gardant les minutes
        datasets = data.datasets.map(dataset => {
            return {
                label: dataset.label,
                data: dataset.data,  // Garder les minutes
                backgroundColor: sportColors[dataset.label] || '#667eea',
                borderColor: sportColors[dataset.label] || '#667eea',
                borderWidth: 1
            };
        });

        // Calculer le maximum dynamique : plus longue activité + 20 min
        // Pour un graphique empilé, on doit sommer les valeurs par jour
        const dailyTotals = labels.map((_, dayIndex) => {
            return datasets.reduce((sum, dataset) => {
                return sum + (dataset.data[dayIndex] || 0);
            }, 0);
        });

        const maxDailyMinutes = Math.max(...dailyTotals);
        const targetMax = maxDailyMinutes + 20;

        // Arrondir à la vingtaine supérieure (multiple de 20)
        maxMinutes = Math.ceil(targetMax / 20) * 20;
    }

    // Réutiliser l'instance si elle existe
    if (charts.dailyHours) {
        charts.dailyHours.data.labels = labels;
        charts.dailyHours.data.datasets = datasets;
        charts.dailyHours.options.scales.y.max = maxMinutes;
        charts.dailyHours.update('none');
        return;
    }

    const ctx = canvas.getContext('2d');
    charts.dailyHours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    title: { display: false },
                    grid: { display: false },
                    beginAtZero: true,
                    max: maxMinutes,  // Maximum dynamique basé sur la plus longue activité
                    ticks: {
                        stepSize: 20,  // Graduation toutes les 20 minutes
                        callback: function(value) {
                            // Afficher seulement le nombre, sans 'min'
                            if (value === 0) return '';
                            return value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const minutes = context.parsed.y;
                            const hours = Math.floor(minutes / 60);
                            const mins = Math.round(minutes % 60);
                            return `${context.dataset.label}: ${hours}h ${mins.toString().padStart(2, '0')} min`;
                        }
                    }
                }
            }
        }
    });
}

function changeWeekOffset(delta) {
    if (currentWeekOffset + delta >= 0) {
        currentWeekOffset += delta;
        loadDailyHours();
    }
}

async function updateWeekLabel(weekInfo) {
    const label = document.getElementById('currentWeekLabel');
    if (currentWeekOffset === 0) {
        label.textContent = '';
    } else {
        label.textContent = `Il y a ${currentWeekOffset} semaine${currentWeekOffset > 1 ? 's' : ''}`;
    }

    // Calculer et afficher la plage de dates (lundi - dimanche)
    const today = new Date();
    const thisMonday = today - (today.getDay() === 0 ? 6 : today.getDay() - 1) * 86400000;
    const startWeek = new Date(thisMonday - currentWeekOffset * 7 * 86400000);
    const monday = new Date(startWeek);
    const sunday = new Date(startWeek);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    const rangeLabel = document.getElementById('dailyWeekRange');
    if (rangeLabel) {
        rangeLabel.textContent = `${formatDate(monday)} - ${formatDate(sunday)}`;
    }

    // Mettre à jour les statistiques de la semaine affichée
    await updateWeekStats(monday, sunday);
}

async function updateWeekStats(monday, sunday) {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Formater les dates pour l'API (YYYY-MM-DD)
        const formatDateForAPI = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDate = formatDateForAPI(monday);
        const endDate = formatDateForAPI(sunday);

        // Récupérer les données de la semaine pour chaque sport
        const responses = await Promise.all([
            fetch(`${API_BASE}/activities/filter_activities?sport_type=Run&start_date=${startDate}&end_date=${endDate}`, { headers }),
            fetch(`${API_BASE}/activities/filter_activities?sport_type=Trail&start_date=${startDate}&end_date=${endDate}`, { headers })
        ]);

        const [runData, trailData] = await Promise.all(
            responses.map(async r => r.ok ? await r.json() : { activities: [] })
        );

        // API already filters correctly with start_date and end_date (including Sunday)
        const runActivities = runData.activities || [];
        const trailActivities = trailData.activities || [];

        // Calculer les totaux pour Run + Trail
        const allActivities = [...runActivities, ...trailActivities];

        // Essayer à la fois distance_km et distance
        const totalDistance = allActivities.reduce((total, activity) => {
            const distance = activity.distance_km || activity.distance || 0;
            return total + distance;
        }, 0);
        const totalElevation = allActivities.reduce((total, activity) => total + (activity.total_elevation_gain || 0), 0);
        const totalTime = allActivities.reduce((total, activity) => total + (activity.moving_time || 0), 0);

        // Mettre à jour l'affichage
        document.getElementById('statDistance').textContent = totalDistance.toFixed(1);
        document.getElementById('statElevation').textContent = Math.round(totalElevation);

        // Convertir le temps total en format HHh MM min
        const hours = Math.floor(totalTime / 60);
        const minutes = Math.round(totalTime % 60);
        document.getElementById('statTime').textContent = `${hours}h ${minutes.toString().padStart(2, '0')} min`;

    } catch (error) {
        console.error('Erreur mise à jour stats semaine:', error);
    }
}

// 2. Graphique des heures par semaine avec navigation
async function loadWeeklyHours() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Ajouter 1 semaine pour s'assurer que la semaine en cours est incluse
        const weeks = 11 + Math.abs(currentWeeklyOffset);
        const url = `${API_BASE}/plot/weekly_bar?value_col=moving_time&weeks=${weeks}`;
        const data = await fetchWithCache(url, { headers }, 300000);

        displayWeeklyHours(data);
        updateWeeklyLabel();
    } catch (error) {
        console.error('Erreur chargement heures hebdomadaires:', error);
    }
}

function displayWeeklyHours(data) {
    const canvas = document.getElementById('weeklyHoursChart');
    if (!canvas) return;

    if (charts.weeklyHours) {
        charts.weeklyHours.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prendre les 10 dernières semaines (les données arrivent du plus ancien au plus récent)
    // Si offset = 0 : prendre les 10 dernières (semaine courante à droite)
    // Si offset = 1 : sauter la dernière et prendre les 10 précédentes
    const totalWeeks = data.length;
    const endIndex = totalWeeks - currentWeeklyOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = data.slice(startIndex, endIndex);

    // Créer les labels avec les dates au format DD/MM
    const labels = weekData.map(d => {
        const date = new Date(d.period);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    });

    // Convertir moving_time (minutes) en heures
    const hours = weekData.map(d => d.moving_time / 60);

    // Calculer et afficher la moyenne
    const totalHours = hours.reduce((sum, h) => sum + h, 0);
    const averageHours = hours.length > 0 ? totalHours / hours.length : 0;
    const averageLabel = document.getElementById('weeklyHoursAverage');
    if (averageLabel) {
        const avgH = Math.floor(averageHours);
        const avgM = Math.round((averageHours - avgH) * 60);
        averageLabel.textContent = `Moyenne : ${avgH}h ${avgM.toString().padStart(2, '0')} min/semaine`;
    }

    // Calculer le maximum dynamique
    const maxHours = Math.max(...hours, 1); // Éviter division par zéro
    // Arrondir à l'entier pair supérieur pour avoir des graduations propres
    const dynamicMax = Math.ceil(maxHours / 2) * 2;
    const backgroundColor = hours.map(h => {
        // Calculer l'intensité (0 = clair, 1 = foncé)
        const intensity = h / maxHours;
        // Interpoler entre orange clair (#E8832A) et orange noir charbon (#3A2010)
        const r = Math.round(232 - intensity * 174);  // De 232 à 58
        const g = Math.round(131 - intensity * 99);   // De 131 à 32
        const b = Math.round(42 - intensity * 26);    // De 42 à 16
        return `rgb(${r}, ${g}, ${b})`;
    });

    charts.weeklyHours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Heures',
                data: hours,
                backgroundColor: backgroundColor,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    title: { display: false },
                    grid: { display: false },
                    beginAtZero: true,
                    max: dynamicMax,
                    ticks: {
                        stepSize: 2,
                        callback: function(value) {
                            return Math.round(value) + 'h';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const totalHours = context.parsed.y;
                            const h = Math.floor(totalHours);
                            const m = Math.round((totalHours - h) * 60);
                            return `${h}h ${m.toString().padStart(2, '0')} min`;
                        }
                    }
                }
            }
        }
    });
}

// Fonction utilitaire pour obtenir le numéro de semaine
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function changeWeeklyView(delta) {
    // Navigation semaine par semaine (delta de 1 ou -1)
    currentWeeklyOffset = Math.max(0, currentWeeklyOffset + delta);
    loadWeeklyHours();
    loadWeeklyDistance(); // Mettre à jour aussi le graphique des distances
}

function updateWeeklyLabel() {
    const label = document.getElementById('weeklyRangeLabel');
    if (currentWeeklyOffset === 0) {
        label.textContent = '';
    } else if (currentWeeklyOffset === 1) {
        label.textContent = 'Il y a 1 semaine';
    } else {
        label.textContent = `Il y a ${currentWeeklyOffset} semaines`;
    }
}

// 3. Graphique des kilomètres par semaine avec filtre
async function loadWeeklyDistance() {
    const headers = getAuthHeaders();
    if (!headers) return;

    const sportFilter = document.getElementById('distanceSportFilter').value;
    const sportTypes = sportFilter.split(',');

    try {
        // Ajouter 1 semaine pour s'assurer que la semaine en cours est incluse
        const weeks = 11 + Math.abs(currentWeeklyOffset);
        let url = `${API_BASE}/plot/weekly_bar?value_col=distance&weeks=${weeks}`;
        if (sportTypes.length > 0) {
            const sportParams = sportTypes.map(s => `sport_types=${encodeURIComponent(s)}`).join('&');
            url += `&${sportParams}`;
        }

        const data = await fetchWithCache(url, { headers }, 300000);
        displayWeeklyDistance(data);
    } catch (error) {
        console.error('Erreur chargement distance hebdomadaire:', error);
    }
}

function displayWeeklyDistance(data) {
    const canvas = document.getElementById('weeklyDistanceChart');
    if (!canvas) return;

    if (charts.weeklyDistance) {
        charts.weeklyDistance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prendre les 10 dernières semaines (les données arrivent du plus ancien au plus récent)
    // Si offset = 0 : prendre les 10 dernières (semaine courante à droite)
    // Si offset = 1 : sauter la dernière et prendre les 10 précédentes
    const totalWeeks = data.length;
    const endIndex = totalWeeks - currentWeeklyOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = data.slice(startIndex, endIndex);

    // Créer les labels avec les dates au format DD/MM
    const labels = weekData.map(d => {
        const date = new Date(d.period);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    });

    // Utiliser directement la distance (déjà en km)
    const distances = weekData.map(d => d.distance);

    // Calculer et afficher la moyenne
    const totalDistance = distances.reduce((sum, d) => sum + d, 0);
    const averageDistance = distances.length > 0 ? totalDistance / distances.length : 0;
    const averageLabel = document.getElementById('weeklyDistanceAverage');
    if (averageLabel) {
        averageLabel.textContent = `Moyenne : ${averageDistance.toFixed(1)} km/semaine`;
    }

    // Calculer l'échelle dynamique
    const maxDistance = Math.max(...distances, 0);
    const suggestedMax = maxDistance > 0 ? Math.ceil(maxDistance * 1.1 / 25) * 25 : 50; // Arrondir au multiple de 25 supérieur avec 10% de marge
    const stepSize = Math.max(Math.ceil(suggestedMax / 8 / 5) * 5, 5); // Environ 8 graduations, arrondies au multiple de 5

    charts.weeklyDistance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distance (km)',
                data: distances,
                borderColor: COLORS.amber,
                backgroundColor: 'rgba(232, 131, 42, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    title: { display: false },
                    grid: { display: false },
                    beginAtZero: true,
                    suggestedMax: suggestedMax,
                    ticks: {
                        stepSize: stepSize,
                        callback: function(value) {
                            return value.toFixed(0) + ' km';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(1)} km`;
                        }
                    }
                }
            }
        }
    });
}

// 4. Graphique de répartition des activités
async function loadRepartition() {
    const headers = getAuthHeaders();
    if (!headers) return;

    const sportFilter = document.getElementById('repartitionSportFilter').value;
    const weeks = document.getElementById('repartitionWeeksFilter').value;
    const sportTypes = sportFilter.split(',');

    try {
        let url = `${API_BASE}/plot/repartition_run?weeks=${weeks}`;
        if (sportTypes.length > 0) {
            const sportParams = sportTypes.map(s => `sport_type=${encodeURIComponent(s)}`).join('&');
            url += `&${sportParams}`;
        }

        const data = await fetchWithCache(url, { headers }, 300000);
        displayRepartition(data);
    } catch (error) {
        console.error('Erreur chargement répartition:', error);
    }
}

function displayRepartition(data) {
    const canvas = document.getElementById('repartitionChart');
    if (!canvas) return;

    if (charts.repartition) {
        charts.repartition.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Mapper les catégories de distance à des couleurs spécifiques
    const distanceColors = {
        'Longs': '#B85A1F',      // Orange foncé
        'Long': '#B85A1F',       // Variante singulier
        'Moyens': '#E8832A',     // Orange clair (COLORS.amber)
        'Moyen': '#E8832A',      // Variante singulier
        'Courts': COLORS.glacier, // Bleu
        'Court': COLORS.glacier   // Variante singulier
    };

    // Attribuer les couleurs en fonction des labels
    const backgroundColors = data.labels.map(label => {
        // Chercher si le label contient un mot-clé
        for (const [key, color] of Object.entries(distanceColors)) {
            if (label.toLowerCase().includes(key.toLowerCase())) {
                return color;
            }
        }
        // Couleur par défaut si aucune correspondance
        return COLORS.amber;
    });

    // Calculer le total pour les pourcentages
    const total = data.values.reduce((sum, val) => sum + val, 0);

    // Plugin personnalisé pour afficher les pourcentages sur le camembert
    const percentagePlugin = {
        id: 'percentageLabels',
        afterDatasetsDraw(chart) {
            const { ctx, data } = chart;
            chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                const { x, y } = datapoint.tooltipPosition();
                const value = data.datasets[0].data[index];
                const percentage = ((value / total) * 100).toFixed(1);

                // N'afficher que si > 5%
                if (percentage > 5) {
                    ctx.save();
                    ctx.font = 'bold 14px Poppins';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${percentage}%`, x, y);
                    ctx.restore();
                }
            });
        }
    };

    charts.repartition = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Nombre d\'activités',
                data: data.values || [],
                backgroundColor: backgroundColors,
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} activité${value > 1 ? 's' : ''} (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [percentagePlugin]
    });
}

// 5. Graphique d'allure moyenne par semaine
async function loadWeeklyPace() {
    const headers = getAuthHeaders();
    if (!headers) return;

    const sportFilter = document.getElementById('paceSportFilter').value;
    const sportTypes = sportFilter.split(',');

    try {
        const weeks = 11 + Math.abs(currentWeeklyOffset);
        let url = `${API_BASE}/plot/weekly_pace?weeks=${weeks}`;
        if (sportTypes.length > 0) {
            const sportParams = sportTypes.map(s => `sport_types=${encodeURIComponent(s)}`).join('&');
            url += `&${sportParams}`;
        }

        const data = await fetchWithCache(url, { headers }, 300000);
        displayWeeklyPace(data);
    } catch (error) {
        console.error('Erreur chargement allure hebdomadaire:', error);
    }
}

function displayWeeklyPace(data) {
    const canvas = document.getElementById('weeklyPaceChart');
    if (!canvas) return;

    if (charts.weeklyPace) {
        charts.weeklyPace.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prendre les 10 dernières semaines
    const totalWeeks = data.length;
    const endIndex = totalWeeks - currentWeeklyOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = data.slice(startIndex, endIndex);

    // Créer les labels avec les dates au format DD/MM
    const labels = weekData.map(d => {
        const date = new Date(d.period);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    });

    // Récupérer les allures en min/km
    const paces = weekData.map(d => d.pace_min_km);

    // Calculer et afficher la moyenne
    const totalPace = paces.reduce((sum, p) => sum + (p || 0), 0);
    const averagePace = paces.length > 0 ? totalPace / paces.length : 0;
    const averageLabel = document.getElementById('weeklyPaceAverage');
    if (averageLabel) {
        const minutes = Math.floor(averagePace);
        const seconds = Math.round((averagePace - minutes) * 60);
        averageLabel.textContent = `Moyenne : ${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
    }

    // Calculer l'échelle dynamique (inversée car plus petit = mieux)
    const minPace = Math.min(...paces.filter(p => p > 0), 10);
    const maxPace = Math.max(...paces, 0);
    const suggestedMin = Math.floor(minPace * 0.9); // 10% de marge en dessous
    const suggestedMax = Math.ceil(maxPace * 1.1);  // 10% de marge au dessus

    charts.weeklyPace = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Allure (min/km)',
                data: paces,
                borderColor: COLORS.glacier,
                backgroundColor: 'rgba(61, 178, 224, 0.2)',
                borderWidth: 2,
                fill: 'start', // Remplir depuis le haut de l'axe (allures lentes) vers la ligne
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    title: { display: false },
                    grid: { display: false },
                    suggestedMin: suggestedMin,
                    suggestedMax: suggestedMax,
                    reverse: true, // Inverser l'axe : allures rapides en haut
                    ticks: {
                        callback: function(value) {
                            const minutes = Math.floor(value);
                            const seconds = Math.round((value - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pace = context.parsed.y;
                            const minutes = Math.floor(pace);
                            const seconds = Math.round((pace - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
                        }
                    }
                }
            }
        }
    });
}

// 6. Gestion des objectifs hebdomadaires
let goalsWeekOffset = 0;

function loadGoals() {
    const goals = JSON.parse(localStorage.getItem('weekly_goals') || '{}');

    const goalRunTrailEl = document.getElementById('goalRunTrail');
    const goalBikeEl = document.getElementById('goalBike');
    const goalSwimEl = document.getElementById('goalSwim');

    if (goalRunTrailEl) goalRunTrailEl.value = goals.runTrail || '';
    if (goalBikeEl) goalBikeEl.value = goals.bike || '';
    if (goalSwimEl) goalSwimEl.value = goals.swim || '';

    // Afficher la semaine courante
    displayCurrentWeek();
}

function changeGoalsWeek(direction) {
    const newOffset = goalsWeekOffset + direction;

    // Ne pas permettre d'aller au-delà de la semaine en cours
    if (newOffset > 0) {
        return;
    }

    goalsWeekOffset = newOffset;
    displayCurrentWeek();

    // Mettre à jour l'état du bouton "suivant"
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    if (nextWeekBtn) {
        nextWeekBtn.disabled = goalsWeekOffset >= 0;
    }
}

function displayCurrentWeek() {
    const currentWeekDisplay = document.getElementById('currentWeekDisplay');
    if (!currentWeekDisplay) return;

    // Obtenir le lundi de la semaine courante + offset
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + (goalsWeekOffset * 7));

    // Obtenir le dimanche de la semaine
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Formater les dates
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    if (goalsWeekOffset === 0) {
        currentWeekDisplay.textContent = `Semaine en cours (${formatDate(monday)} - ${formatDate(sunday)})`;
    } else {
        currentWeekDisplay.textContent = `Semaine du ${formatDate(monday)} au ${formatDate(sunday)}`;
    }
}

function saveGoals() {
    const goals = {
        runTrail: parseFloat(document.getElementById('goalRunTrail').value) || 0,
        bike: parseFloat(document.getElementById('goalBike').value) || 0,
        swim: parseFloat(document.getElementById('goalSwim').value) || 0
    };

    localStorage.setItem('weekly_goals', JSON.stringify(goals));
}

function updateWeeklySummary(allActivities, prevActivities, goals) {
    // Calculer les totaux pour TOUTES les activités
    const getDistance = (activity) => activity.distance_km || activity.distance || 0;
    const getElevation = (activity) => activity.total_elevation_gain || 0;
    const getHours = (activity) => (activity.moving_time || activity.elapsed_time || 0) / 60; // Convertir minutes en heures

    const totalDistance = allActivities.reduce((sum, act) => sum + getDistance(act), 0);
    const totalElevation = allActivities.reduce((sum, act) => sum + getElevation(act), 0);
    const totalHours = allActivities.reduce((sum, act) => sum + getHours(act), 0);
    const totalSessions = allActivities.length; // Compte toutes les activités (Run, Trail, Bike, Swim, WeightTraining, etc.)

    // Calculer les heures de la semaine précédente
    const prevHours = prevActivities.reduce((sum, act) => sum + getHours(act), 0);

    // Calculer le pourcentage de différence
    let percentageDiff = 0;
    if (prevHours > 0) {
        percentageDiff = ((totalHours - prevHours) / prevHours) * 100;
    } else if (totalHours > 0) {
        percentageDiff = 100; // Si aucune activité la semaine d'avant mais des activités cette semaine
    }

    // Déterminer la tendance avec le pourcentage
    const trendEl = document.getElementById('weeklyTrend');
    if (trendEl) {
        const absPercentage = Math.abs(percentageDiff);
        if (percentageDiff > 0) {
            trendEl.textContent = `↑ ${absPercentage.toFixed(0)}%`;
            trendEl.style.color = '#6DAA75'; // Vert (moss)
        } else if (percentageDiff < 0) {
            trendEl.textContent = `↓ ${absPercentage.toFixed(0)}%`;
            trendEl.style.color = '#E74C3C'; // Rouge
        } else {
            trendEl.textContent = '→ 0%';
            trendEl.style.color = '#3A3F47'; // Gris
        }
    }

    // Calculer le pourcentage de l'objectif global (somme des objectifs)
    const totalGoal = (goals.runTrail || 0) + (goals.bike || 0) + (goals.swim || 0);
    const percentage = totalGoal > 0 ? Math.min((totalDistance / totalGoal) * 100, 100) : 0;

    // Mettre à jour les éléments DOM
    const distanceEl = document.getElementById('weeklySummaryDistance');
    const elevationEl = document.getElementById('weeklySummaryElevation');
    const sessionsEl = document.getElementById('weeklySummarySessions');
    const progressBar = document.getElementById('weeklyProgressBar');
    const progressText = document.getElementById('weeklyProgressText');

    if (distanceEl) distanceEl.textContent = `${totalDistance.toFixed(1)} km`;
    if (elevationEl) elevationEl.textContent = `${Math.round(totalElevation).toLocaleString()} m`;
    if (sessionsEl) sessionsEl.textContent = totalSessions;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${Math.round(percentage)}% de l'objectif hebdomadaire`;
}

async function updateWeeklySummaryData() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Calculer les dates de la semaine courante (lundi à dimanche)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday + (goalsWeekOffset * 7));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const formatDateForAPI = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDate = formatDateForAPI(monday);
        const endDate = formatDateForAPI(sunday);

        // Récupérer toutes les activités de la semaine
        const response = await fetch(`${API_BASE}/activities/filter_activities?start_date=${startDate}&end_date=${endDate}`, { headers });
        if (!response.ok) return;

        const allActivitiesData = await response.json();
        const normalizeData = (data) => {
            if (Array.isArray(data)) return data;
            if (data?.activities && Array.isArray(data.activities)) return data.activities;
            return [];
        };

        const allActivities = normalizeData(allActivitiesData);

        // Récupérer les activités de la semaine précédente
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        const prevSunday = new Date(sunday);
        prevSunday.setDate(sunday.getDate() - 7);

        const prevStartDate = formatDateForAPI(prevMonday);
        const prevEndDate = formatDateForAPI(prevSunday);

        const prevResponse = await fetch(`${API_BASE}/activities/filter_activities?start_date=${prevStartDate}&end_date=${prevEndDate}`, { headers });
        let prevActivities = [];
        if (prevResponse.ok) {
            const prevData = await prevResponse.json();
            prevActivities = normalizeData(prevData);
        }

        const goals = JSON.parse(localStorage.getItem('weekly_goals') || '{}');
        updateWeeklySummary(allActivities, prevActivities, goals);

    } catch (error) {
        console.error('Erreur mise à jour card Cette Semaine:', error);
    }
}

async function updateMonthlySummary() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        // Calculer les dates du mois en cours (1er du mois à aujourd'hui)
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        lastDayOfMonth.setHours(23, 59, 59, 999);

        // Formater les dates pour l'API (YYYY-MM-DD)
        const formatDateForAPI = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDate = formatDateForAPI(firstDayOfMonth);
        const endDate = formatDateForAPI(lastDayOfMonth);

        // Récupérer TOUTES les activités du mois (sans filtrer par sport)
        const response = await fetch(`${API_BASE}/activities/filter_activities?start_date=${startDate}&end_date=${endDate}`, { headers });

        if (!response.ok) {
            console.warn('Erreur API:', response.status, response.statusText);
            return;
        }

        const allActivitiesData = await response.json();

        // Normaliser les données
        const normalizeData = (data) => {
            if (Array.isArray(data)) return data;
            if (data?.activities && Array.isArray(data.activities)) return data.activities;
            return [];
        };

        const allActivities = normalizeData(allActivitiesData);

        const getDistance = (activity) => activity.distance_km || activity.distance || 0;
        const getElevation = (activity) => activity.total_elevation_gain || 0;
        const getHours = (activity) => (activity.moving_time || activity.elapsed_time || 0) / 60; // Convertir minutes en heures

        const totalDistance = allActivities.reduce((sum, act) => sum + getDistance(act), 0);
        const totalElevation = allActivities.reduce((sum, act) => sum + getElevation(act), 0);
        const totalHours = allActivities.reduce((sum, act) => sum + getHours(act), 0);
        const totalSessions = allActivities.length; // Compte toutes les activités (Run, Trail, Bike, Swim, WeightTraining, etc.)

        // Récupérer les données du mois précédent pour comparaison
        // IMPORTANT: On compare avec le même nombre de jours du mois précédent
        const daysPassed = today.getDate(); // Nombre de jours écoulés dans le mois en cours

        const prevFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        // Pour comparer équitablement, on prend les mêmes jours du mois précédent
        const prevLastDayToCompare = new Date(today.getFullYear(), today.getMonth() - 1, daysPassed);

        const prevStartDate = formatDateForAPI(prevFirstDay);
        const prevEndDate = formatDateForAPI(prevLastDayToCompare);

        const prevResponse = await fetch(`${API_BASE}/activities/filter_activities?start_date=${prevStartDate}&end_date=${prevEndDate}`, { headers });
        let prevActivities = [];
        if (prevResponse.ok) {
            const prevData = await prevResponse.json();
            prevActivities = normalizeData(prevData);
        }

        // Calculer les heures du mois précédent (sur le même nombre de jours)
        const prevHours = prevActivities.reduce((sum, act) => sum + getHours(act), 0);

        // Calculer le pourcentage de différence
        let percentageDiff = 0;
        if (prevHours > 0) {
            percentageDiff = ((totalHours - prevHours) / prevHours) * 100;
        } else if (totalHours > 0) {
            percentageDiff = 100; // Si aucune activité le mois d'avant mais des activités ce mois
        }

        // Déterminer la tendance avec le pourcentage
        const trendEl = document.getElementById('monthlyTrend');
        if (trendEl) {
            const absPercentage = Math.abs(percentageDiff);
            if (percentageDiff > 0) {
                trendEl.textContent = `↑ ${absPercentage.toFixed(0)}%`;
                trendEl.style.color = '#6DAA75'; // Vert (moss)
            } else if (percentageDiff < 0) {
                trendEl.textContent = `↓ ${absPercentage.toFixed(0)}%`;
                trendEl.style.color = '#E74C3C'; // Rouge
            } else {
                trendEl.textContent = '→ 0%';
                trendEl.style.color = '#3A3F47'; // Gris
            }
        }

        // Calculer le pourcentage du mois écoulé
        const daysInMonth = lastDayOfMonth.getDate();
        const monthProgress = (daysPassed / daysInMonth) * 100;

        // Mettre à jour les éléments DOM
        const distanceEl = document.getElementById('monthlySummaryDistance');
        const elevationEl = document.getElementById('monthlySummaryElevation');
        const sessionsEl = document.getElementById('monthlySummarySessions');
        const progressBar = document.getElementById('monthlyProgressBar');
        const progressText = document.getElementById('monthlyProgressText');

        if (distanceEl) distanceEl.textContent = `${totalDistance.toFixed(1)} km`;
        if (elevationEl) elevationEl.textContent = `${Math.round(totalElevation).toLocaleString()} m`;
        if (sessionsEl) sessionsEl.textContent = totalSessions;
        if (progressBar) progressBar.style.width = `${monthProgress}%`;
        if (progressText) progressText.textContent = `${daysPassed}/${daysInMonth} jours du mois`;

    } catch (error) {
        console.error('Erreur mise à jour résumé mensuel:', error);
    }
}

// -----------------------------
// Streak (Série d'activités)
// -----------------------------
async function loadStreak() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/kpi/streak`, { headers });
        if (!response.ok) {
            console.error('Erreur chargement streak');
            return;
        }

        const data = await response.json();

        const weeksEl = document.getElementById('streakWeeks');
        const activitiesEl = document.getElementById('streakActivities');

        if (weeksEl) {
            weeksEl.textContent = `${data.streak_weeks} sem.`;
        }
        if (activitiesEl) {
            activitiesEl.textContent = data.total_activities;
        }

    } catch (error) {
        console.error('Erreur chargement streak:', error);
    }
}

async function loadRecords() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/kpi/records`, { headers });
        if (!response.ok) {
            console.error('Erreur chargement records');
            return;
        }

        const data = await response.json();
        displayRecords(data.records);

    } catch (error) {
        console.error('Erreur chargement records:', error);
    }
}

function displayRecords(records) {
    // Récupérer tous les record-item dans l'ordre
    const recordItems = document.querySelectorAll('.record-item');

    recordItems.forEach((item) => {
        const distanceText = item.querySelector('.record-distance').textContent.trim();

        // Trouver la clé correspondante
        let recordKey = null;
        if (distanceText === '5 km') recordKey = '5k';
        else if (distanceText === '10 km') recordKey = '10k';
        else if (distanceText === 'Semi') recordKey = 'semi';
        else if (distanceText === '30 km') recordKey = '30k';
        else if (distanceText === 'Marathon') recordKey = 'marathon';
        else if (distanceText === '50 km') recordKey = '50k';
        else if (distanceText === '75 km') recordKey = '75k';
        else if (distanceText === 'Plus longue') recordKey = 'longest';

        if (!recordKey) return;

        const record = records[recordKey];
        const timeEl = item.querySelector('.record-time');
        const dateEl = item.querySelector('.record-date');
        const prDot = item.querySelector('.record-pr-dot');

        if (record && (record.time || record.distance)) {
            // Formater la date en JJ/MM/YY
            const dateObj = new Date(record.date);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear().toString().slice(-2);
            const formattedDate = `${day}/${month}/${year}`;

            // Mettre à jour les données
            dateEl.textContent = formattedDate;

            if (recordKey === 'longest') {
                // Pour la plus longue sortie, afficher la distance en km
                const distanceKm = parseFloat(record.distance);
                timeEl.textContent = `${distanceKm.toFixed(2)} km`;
            } else {
                // Pour les autres, afficher le temps
                timeEl.textContent = record.time;
            }

            // Tous les records sont des PR par définition, afficher le point PR
            item.classList.add('is-pr');
            if (prDot) prDot.style.display = 'block';

            // Rendre l'item cliquable vers l'activité dans l'app
            item.style.cursor = 'pointer';

            item.onclick = () => {
                showActivityDetail(record.activity_id);
            };

            // Ajouter un tooltip avec les infos
            const tooltipText = recordKey === 'longest'
                ? `${record.activity_name}\nDate: ${record.date}\nDistance: ${parseFloat(record.distance).toFixed(2)} km\nCliquez pour voir les détails`
                : `${record.activity_name}\nDate: ${record.date}\nSegment: ${record.start_km}km → ${record.end_km}km\nCliquez pour voir les détails`;
            item.title = tooltipText;

        } else {
            // Pas de record disponible
            timeEl.textContent = recordKey === 'longest' ? '--.- km' : '--:--';
            dateEl.textContent = '--/--/--';
            item.classList.remove('is-pr');
            if (prDot) prDot.style.display = 'none';
            item.style.cursor = 'default';
            item.onclick = null;
            item.title = 'Aucun record pour cette distance';
        }
    });
}

// -----------------------------
// Calendrier
// -----------------------------
let currentCalendarDate = new Date();

async function loadCalendar() {
    await generateCalendar(currentCalendarDate);
}

async function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    await generateCalendar(currentCalendarDate);
}

async function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    await generateCalendar(currentCalendarDate);
}

async function generateCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Mettre à jour le titre
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

    // Charger les activités du mois
    const activities = await loadActivitiesForCalendar(year, month);

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);

    // Ajuster pour que la semaine commence le lundi (0 = dimanche, 1 = lundi, ...)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convertir dimanche (0) en 6

    // Date de début (peut être dans le mois précédent)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startDayOfWeek);

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // En-têtes des jours de la semaine
    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-weekdays';

    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-weekday';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // En-tête pour la colonne des stats
    const statsHeader = document.createElement('div');
    statsHeader.className = 'calendar-week-stats-header';
    statsHeader.textContent = 'Semaine';
    calendarGrid.appendChild(statsHeader);

    // Générer les jours
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);
    let weekCount = 0;

    // Couleurs des sports
    const sportColors = {
        'Run': { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A' },
        'Trail': { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A' },
        'Bike': { bg: 'rgba(61, 178, 224, 0.125)', color: '#3DB2E0' },
        'Swim': { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75' },
        'Hike': { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75' },
        'WeightTraining': { bg: 'rgba(58, 63, 71, 0.125)', color: '#3A3F47' }
    };

    while (currentDate <= lastDay || currentDate.getDay() !== 1) {
        const weekElement = document.createElement('div');
        weekElement.className = 'calendar-week';

        // Variables pour calculer les stats de la semaine
        let weekTotalDistance = 0;
        let weekTotalTime = 0;
        let weekRunTrailDistance = 0;  // Pour l'allure (Run & Trail uniquement)
        let weekRunTrailTime = 0;

        // Générer 7 jours pour cette semaine
        for (let i = 0; i < 7; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.getTime() === today.getTime();

            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            if (isToday) {
                dayElement.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDate.getDate();
            dayElement.appendChild(dayNumber);

            // Zone pour les activités avec tags de sport
            const activitiesDiv = document.createElement('div');
            activitiesDiv.className = 'calendar-day-activities';

            // Trouver les activités pour ce jour (utiliser date locale au lieu de UTC)
            const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const dayActivities = activities.filter(activity => {
                const activityDate = new Date(activity.start_date);
                const activityDateKey = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}-${String(activityDate.getDate()).padStart(2, '0')}`;
                return activityDateKey === dateKey;
            });

            // Calculer les totaux de la semaine
            dayActivities.forEach(activity => {
                weekTotalDistance += activity.distance || 0;
                weekTotalTime += activity.moving_time || 0;

                // Pour l'allure, uniquement Run & Trail
                if (activity.sport_type === 'Run' || activity.sport_type === 'Trail') {
                    weekRunTrailDistance += activity.distance || 0;
                    weekRunTrailTime += activity.moving_time || 0;
                }
            });

            // Créer des tags pour chaque sport unique du jour
            if (dayActivities.length > 0) {
                const uniqueSports = [...new Set(dayActivities.map(a => a.sport_type))];
                uniqueSports.forEach(sport => {
                    const sportColor = sportColors[sport] || { bg: 'rgba(255, 255, 255, 0.1)', color: '#F2F2F2' };
                    const badge = document.createElement('div');
                    badge.className = 'calendar-sport-badge';
                    badge.style.backgroundColor = sportColor.bg;
                    badge.style.color = sportColor.color;
                    badge.textContent = sport;
                    activitiesDiv.appendChild(badge);
                });
            }

            dayElement.appendChild(activitiesDiv);
            calendarGrid.appendChild(dayElement);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Formater le temps en XhYY (moving_time est en minutes)
        const hours = Math.floor(weekTotalTime / 60);
        const minutes = Math.floor(weekTotalTime % 60);
        const timeFormatted = weekTotalTime > 0 ? `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}` : '-';
        const distanceFormatted = weekTotalDistance > 0 ? `${weekTotalDistance.toFixed(1)} km` : '-';

        // Calculer l'allure moyenne pondérée UNIQUEMENT pour Run & Trail (moving_time est en minutes, distance en km)
        const weekAveragePace = weekRunTrailDistance > 0 ? weekRunTrailTime / weekRunTrailDistance : 0;
        const paceMinutes = Math.floor(weekAveragePace);
        const paceSeconds = Math.round((weekAveragePace - paceMinutes) * 60);
        const paceFormatted = weekAveragePace > 0 ? `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km` : '-';

        // Ajouter la zone de stats de la semaine
        const weekStats = document.createElement('div');
        weekStats.className = 'calendar-week-stats';
        weekStats.innerHTML = `
            <div class="calendar-week-stats-item">
                <span class="calendar-week-stats-label">Distance:</span>
                <span class="calendar-week-stats-value">${distanceFormatted}</span>
            </div>
            <div class="calendar-week-stats-item">
                <span class="calendar-week-stats-label">Temps:</span>
                <span class="calendar-week-stats-value">${timeFormatted}</span>
            </div>
            <div class="calendar-week-stats-item">
                <span class="calendar-week-stats-label">Allure:</span>
                <span class="calendar-week-stats-value">${paceFormatted}</span>
            </div>
        `;
        calendarGrid.appendChild(weekStats);

        weekCount++;

        // Arrêter si on a dépassé le dernier jour du mois et qu'on est sur un lundi
        if (currentDate > lastDay && currentDate.getDay() === 1) {
            break;
        }
    }
}

async function loadActivitiesForCalendar(year, month) {
    const headers = getAuthHeaders();
    if (!headers) return [];

    try {
        const response = await fetch(`${API_BASE}/activities/activities`, { headers });
        if (response.ok) {
            const activities = await response.json();

            // Calculer la plage de dates à afficher dans le calendrier
            const firstDay = new Date(year, month, 1);
            let startDayOfWeek = firstDay.getDay();
            startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

            const calendarStartDate = new Date(firstDay);
            calendarStartDate.setDate(firstDay.getDate() - startDayOfWeek);

            const lastDay = new Date(year, month + 1, 0);
            const calendarEndDate = new Date(lastDay);
            calendarEndDate.setDate(calendarEndDate.getDate() + (7 - calendarEndDate.getDay()));

            // Filtrer les activités dans la plage complète du calendrier affiché
            return activities.filter(activity => {
                const activityDate = new Date(activity.start_date);
                return activityDate >= calendarStartDate && activityDate <= calendarEndDate;
            });
        }
    } catch (error) {
        console.error('Erreur chargement activités pour calendrier:', error);
    }
    return [];
}

// -----------------------------
// Page Activités
// -----------------------------
let allActivities = [];
let currentActivityPage = 1;
const activitiesPerPage = 10;

async function loadActivities() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/activities/activities`, { headers });
        if (response.ok) {
            allActivities = await response.json();
            // Trier par date décroissante
            allActivities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            currentActivityPage = 1;
            displayActivities();
        }
    } catch (error) {
        console.error('Erreur chargement activités:', error);
    }
}

function displayActivities() {
    const container = document.getElementById('activitiesList');
    if (!container) return;

    const startIndex = (currentActivityPage - 1) * activitiesPerPage;
    const endIndex = startIndex + activitiesPerPage;
    const activitiesToShow = allActivities.slice(startIndex, endIndex);

    const sportColors = {
        'Run': { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A' },
        'Trail': { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A' },
        'Bike': { bg: 'rgba(61, 178, 224, 0.125)', color: '#3DB2E0' },
        'Swim': { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75' },
        'Hike': { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75' },
        'WeightTraining': { bg: 'rgba(58, 63, 71, 0.125)', color: '#3A3F47' }
    };

    container.innerHTML = activitiesToShow.map(activity => {
        const date = new Date(activity.start_date);
        const formattedDate = `${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
        const sportColor = sportColors[activity.sport_type] || sportColors['Run'];

        return `
            <div class="activity-card" style="--color: ${sportColor.color};">
                <div onclick="showActivityDetail(${activity.id})" style="cursor: pointer;">
                    <div class="activity-card-header">
                        <div>
                            <h5 class="activity-card-title">${activity.name || 'Activité sans titre'}</h5>
                            <div class="activity-card-date">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 2v4"></path>
                                    <path d="M16 2v4"></path>
                                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                    <path d="M3 10h18"></path>
                                </svg>
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                        <div class="activity-card-badge" style="background-color: ${sportColor.bg}; color: ${sportColor.color};">
                            ${activity.sport_type}
                        </div>
                    </div>
                    <div class="activity-card-stats">
                        <div class="activity-card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="${COLORS.amber}" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <div>
                                <p class="activity-card-stat-value" style="color: ${COLORS.amber};">${(activity.distance || 0).toFixed(1)} km</p>
                                <p class="activity-card-stat-label">Distance</p>
                            </div>
                        </div>
                        <div class="activity-card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="${COLORS.glacier}" stroke-width="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                            <div>
                                <p class="activity-card-stat-value" style="color: ${COLORS.glacier};">${activity.moving_time_hms || '-'}</p>
                                <p class="activity-card-stat-label">Durée</p>
                            </div>
                        </div>
                        ${activity.sport_type !== 'WeightTraining' && activity.speed_minutes_per_km_hms ? `
                        <div class="activity-card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="${COLORS.amber}" stroke-width="2" viewBox="0 0 24 24">
                                <path d="m12 14 4-4"></path>
                                <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                            </svg>
                            <div>
                                <p class="activity-card-stat-value" style="color: ${COLORS.amber};">${activity.speed_minutes_per_km_hms} /km</p>
                                <p class="activity-card-stat-label">Allure</p>
                            </div>
                        </div>
                        ` : ''}
                        ${activity.total_elevation_gain ? `
                        <div class="activity-card-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="${COLORS.glacier}" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <div>
                                <p class="activity-card-stat-value" style="color: ${COLORS.glacier};">${Math.round(activity.total_elevation_gain)} m</p>
                                <p class="activity-card-stat-label">D+</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="activity-card-actions">
                    <button class="btn-icon btn-edit" onclick="event.stopPropagation(); openActivityModal(${activity.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Modifier
                    </button>
                    <button class="btn-icon btn-delete" onclick="event.stopPropagation(); deleteActivity(${activity.id}, '${activity.name?.replace(/'/g, "\\'")}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Mettre à jour la pagination
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(allActivities.length / activitiesPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentActivityPage} sur ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = currentActivityPage === 1;
    document.getElementById('nextPageBtn').disabled = currentActivityPage === totalPages;
}

function changePage(delta) {
    const totalPages = Math.ceil(allActivities.length / activitiesPerPage);
    const newPage = currentActivityPage + delta;

    if (newPage >= 1 && newPage <= totalPages) {
        currentActivityPage = newPage;
        displayActivities();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// === GESTION DU MENU DROPDOWN ===
function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = event.target.closest('.dropdown');
    const isActive = dropdown.classList.contains('active');

    // Fermer tous les dropdowns
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));

    // Ouvrir/fermer le dropdown cliqué
    if (!isActive) {
        dropdown.classList.add('active');
    }
}

// Fermer le dropdown quand on clique ailleurs
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
    }
});

// Fermer le dropdown après un clic sur un item
document.addEventListener('click', function(event) {
    if (event.target.closest('.dropdown-item')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    currentToken = localStorage.getItem('eyesight_token');

    if (currentToken && !isTokenExpired()) {
        // Token valide, charger le dashboard
        autoUpdateData();
        showPage('dashboardPage');
        loadDashboard();
    } else {
        // Pas de token ou token expiré, afficher la page de connexion
        if (currentToken) {
            // Token expiré, nettoyer
            localStorage.removeItem('eyesight_token');
            currentToken = null;
        }
        showPage('loginPage');
    }

    updateNavigation();
});

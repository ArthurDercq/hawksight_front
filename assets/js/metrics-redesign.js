// =============================================================================
// METRICS REDESIGN - Nouveau design
// =============================================================================

function getIconPath(iconName) {
    const icons = {
        'Activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'TrendingUp': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
        'Clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'Mountain': '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
        'Zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'Target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
    };
    return icons[iconName] || '';
}

function displayKPIsRedesign(kpis) {
    const container = document.getElementById('kpiContainer');
    container.innerHTML = '';

    const formatNumber = (num) => {
        const roundedNum = Math.ceil(num);
        const formatted = new Intl.NumberFormat('fr-FR').format(roundedNum);
        return formatted.replace(/\s/g, '.');
    };

    // Métriques exactes comme avant: run, trail, bike, swim, total_hours, dplus_run_trail, dplus_bike
    const metrics = [
        {
            icon: "Activity",
            label: "Course à pied",
            value: formatNumber(kpis.total_km_run || 0),
            unit: "km",
            color: "#3DB2E0"
        },
        {
            icon: "Mountain",
            label: "Trail",
            value: formatNumber(kpis.total_km_trail || 0),
            unit: "km",
            color: "#1E6A8F"
        },
        {
            icon: "TrendingUp",
            label: "Vélo",
            value: formatNumber(kpis.total_km_bike || 0),
            unit: "km",
            color: "#7B6BC8"
        },
        {
            icon: "Target",
            label: "Natation",
            value: formatNumber(kpis.total_km_swim || 0),
            unit: "km",
            color: "#8B92A0"
        },
        {
            icon: "Clock",
            label: "Sport",
            value: formatNumber(kpis.total_hours || 0),
            unit: "h",
            color: "#E8832A"
        },
        {
            icon: "Zap",
            label: "Dénivelé en courant",
            value: formatNumber(kpis.total_dplus_run_trail || 0),
            unit: "m",
            color: "#9477D9"
        },
        {
            icon: "Zap",
            label: "Dénivelé à vélo",
            value: formatNumber(kpis.total_dplus_bike || 0),
            unit: "m",
            color: "#5A5F6C"
        }
    ];

    // Créer la grille des métriques
    const grid = document.createElement('div');
    grid.className = 'metrics-grid-new';

    metrics.forEach(m => {
        const card = document.createElement('div');
        card.className = 'metric-card-new';
        if (m.id) card.id = m.id;

        // Appliquer la variable CSS pour le hover
        card.style.setProperty('--metric-color', m.color);

        card.innerHTML = `
            <div class="metric-glow"></div>

            <div class="metric-card-inner">
                <div class="metric-grid-pattern"></div>
                <div class="metric-corner-glow"></div>

                <div class="metric-content">
                    <div class="metric-header-row">
                        <div class="metric-icon-wrapper">
                            <div class="metric-icon-badge" style="background-color: ${m.color}10; border-color: ${m.color}30;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${m.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="metric-icon-svg">
                                    ${getIconPath(m.icon)}
                                </svg>
                            </div>
                            <span class="metric-label">${m.label}</span>
                        </div>
                    </div>

                    <div class="metric-value-row">
                        <span class="metric-value-text" style="color: ${m.color}">${m.value}</span>
                        ${m.unit ? `<span class="metric-unit-text">${m.unit}</span>` : ''}
                    </div>
                </div>

                <div class="metric-dots-bottom">
                    <div class="metric-dot-item" style="background: ${m.color}"></div>
                    <div class="metric-dot-item" style="background: ${m.color}; opacity: 0.6"></div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    container.appendChild(grid);

    // ==========================
    // Graphique horizontal : nombre d'activités par sport
    // ==========================
    if (kpis["nombre d'activités par sport"]) {
        const chartContainer = document.getElementById('activityCountChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '';

            if (window.charts && window.charts.activityCount) {
                window.charts.activityCount.destroy();
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
                    backgroundColors.push(sportColors[sport] || '#3DB2E0');
                }
            });

            if (!window.charts) window.charts = {};

            window.charts.activityCount = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nombre d\'activités',
                        data: counts,
                        backgroundColor: backgroundColors,
                        borderColor: '#0B0C10',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right',
                            labels: {
                                color: '#F2F2F2',
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11
                                },
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        const dataset = data.datasets[0];
                                        const total = dataset.data.reduce((a, b) => a + b, 0);
                                        return data.labels.map((label, i) => {
                                            const value = dataset.data[i];
                                            const percentage = ((value / total) * 100).toFixed(1);
                                            return {
                                                text: `${label}: ${percentage}%`,
                                                fillStyle: dataset.backgroundColor[i],
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        datalabels: {
                            color: '#F2F2F2',
                            font: {
                                family: "'JetBrains Mono', monospace",
                                size: 12,
                                weight: 600
                            },
                            formatter: function(value, context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return percentage + '%';
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(11, 12, 16, 0.95)',
                            titleColor: '#F2F2F2',
                            bodyColor: '#F2F2F2',
                            borderColor: 'rgba(61, 178, 224, 0.3)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return ` ${label}: ${value} activités (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }
}

// Remplacer la fonction displayKPIs originale
if (typeof window.displayKPIs === 'function') {
    window.displayKPIsOriginal = window.displayKPIs;
}
window.displayKPIs = displayKPIsRedesign;

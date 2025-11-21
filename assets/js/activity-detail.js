// ============================================
// ACTIVITY DETAIL PAGE
// ============================================

let detailMap = null;
let detailCharts = {};

// Fonction pour afficher la page de détails d'une activité
async function showActivityDetail(activityId) {
    showPage('activityDetailPage');

    const headers = getAuthHeaders();
    if (!headers) {
        console.error('Pas d'authentification');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/activities/activity_detail/${activityId}`, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des détails');
        }

        const data = await response.json();
        if (data.error) {
            console.error(data.error);
            return;
        }

        displayActivityDetail(data.activity, data.streams);
    } catch (error) {
        console.error('Erreur chargement détails activité:', error);
    }
}

// Afficher les détails de l'activité
function displayActivityDetail(activity, streams) {
    // Titre et métadonnées
    document.getElementById('detailActivityName').textContent = activity.name || 'Activité sans titre';

    const date = new Date(activity.start_date);
    const formattedDate = `${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'long' })} ${date.getFullYear()} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('detailActivityDate').textContent = formattedDate;

    const typeEl = document.getElementById('detailActivityType');
    typeEl.textContent = activity.sport_type;
    const sportColors = {
        'Run': '#E8832A',
        'Trail': '#E8832A',
        'Bike': '#3DB2E0',
        'Swim': '#6DAA75',
        'Hike': '#6DAA75',
        'WeightTraining': '#3A3F47'
    };
    typeEl.style.backgroundColor = `${sportColors[activity.sport_type] || '#E8832A'}22`;
    typeEl.style.color = sportColors[activity.sport_type] || '#E8832A';

    // Stats principales
    document.getElementById('detailDistance').textContent = `${(activity.distance || 0).toFixed(2)} km`;
    document.getElementById('detailDuration').textContent = activity.moving_time_hms || '--';
    document.getElementById('detailPace').textContent = activity.speed_minutes_per_km_hms ? `${activity.speed_minutes_per_km_hms} /km` : '--';
    document.getElementById('detailElevation').textContent = activity.total_elevation_gain ? `${Math.round(activity.total_elevation_gain)} m` : '--';
    document.getElementById('detailHeartrate').textContent = activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '--';
    document.getElementById('detailCadence').textContent = activity.average_cadence ? `${Math.round(activity.average_cadence)} spm` : '--';

    // Afficher les graphiques avec les streams
    if (streams && streams.length > 0) {
        displayDetailMap(streams);
        displayDetailElevationChart(streams);
        displayDetailHeartrateChart(streams);
        displayDetailPaceChart(streams);
        displayDetailCadenceChart(streams);
        displayDetailGradeChart(streams);

        // Afficher power et temp seulement s'il y a des données
        const hasPower = streams.some(s => s.power !== null && s.power !== undefined);
        const hasTemp = streams.some(s => s.temp !== null && s.temp !== undefined);

        if (hasPower) {
            document.getElementById('detailPowerCard').style.display = 'block';
            displayDetailPowerChart(streams);
        } else {
            document.getElementById('detailPowerCard').style.display = 'none';
        }

        if (hasTemp) {
            document.getElementById('detailTempCard').style.display = 'block';
            displayDetailTempChart(streams);
        } else {
            document.getElementById('detailTempCard').style.display = 'none';
        }
    }
}

// Carte interactive
function displayDetailMap(streams) {
    const mapContainer = document.getElementById('detailMap');

    // Nettoyer la carte existante
    if (detailMap) {
        detailMap.remove();
    }

    // Filtrer les coordonnées valides
    const coords = streams
        .filter(s => s.lat && s.lon)
        .map(s => [s.lat, s.lon]);

    if (coords.length === 0) {
        mapContainer.innerHTML = '<p style="text-align: center; color: var(--color-steel);">Pas de données GPS disponibles</p>';
        return;
    }

    // Créer la carte
    detailMap = L.map('detailMap').fitBounds(coords);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap);

    // Tracer la trace
    L.polyline(coords, {
        color: COLORS.amber,
        weight: 3,
        opacity: 0.8
    }).addTo(detailMap);

    // Markers de départ et arrivée
    L.circleMarker(coords[0], {
        radius: 8,
        fillColor: COLORS.moss,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
    }).addTo(detailMap).bindPopup('Départ');

    L.circleMarker(coords[coords.length - 1], {
        radius: 8,
        fillColor: COLORS.glacier,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
    }).addTo(detailMap).bindPopup('Arrivée');
}

// Profil d'élévation
function displayDetailElevationChart(streams) {
    const ctx = document.getElementById('detailElevationChart');
    if (!ctx) return;

    // Détruire le graphique existant
    if (detailCharts.elevation) {
        detailCharts.elevation.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const altitudes = streams.map(s => s.altitude || 0);

    detailCharts.elevation = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Altitude (m)',
                data: altitudes,
                borderColor: COLORS.glacier,
                backgroundColor: `${COLORS.glacier}33`,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => `${item.parsed.y.toFixed(0)} m`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Altitude (m)' }
                }
            }
        }
    });
}

// Fréquence cardiaque
function displayDetailHeartrateChart(streams) {
    const ctx = document.getElementById('detailHeartrateChart');
    if (!ctx) return;

    if (detailCharts.heartrate) {
        detailCharts.heartrate.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const heartrates = streams.map(s => s.heartrate || null);

    // Vérifier s'il y a des données
    const hasData = heartrates.some(hr => hr !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de données de fréquence cardiaque</p>';
        return;
    }

    // Calculer les stats
    const validHR = heartrates.filter(hr => hr !== null);
    const avgHR = (validHR.reduce((a, b) => a + b, 0) / validHR.length).toFixed(0);
    const maxHR = Math.max(...validHR);
    const minHR = Math.min(...validHR);

    document.getElementById('heartrateStats').innerHTML = `
        <span>Moy: <strong>${avgHR} bpm</strong></span>
        <span>Min: <strong>${minHR} bpm</strong></span>
        <span>Max: <strong>${maxHR} bpm</strong></span>
    `;

    detailCharts.heartrate = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Fréquence cardiaque (bpm)',
                data: heartrates,
                borderColor: '#ff4757',
                backgroundColor: '#ff475722',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y ? `${item.parsed.y.toFixed(0)} bpm` : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'BPM' }
                }
            }
        }
    });
}

// Allure
function displayDetailPaceChart(streams) {
    const ctx = document.getElementById('detailPaceChart');
    if (!ctx) return;

    if (detailCharts.pace) {
        detailCharts.pace.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));

    // Calculer l'allure à partir de velocity_smooth (m/s)
    const paces = streams.map(s => {
        if (!s.velocity_smooth || s.velocity_smooth === 0) return null;
        // Convertir m/s en min/km
        const kmh = s.velocity_smooth * 3.6;
        return 60 / kmh; // min/km
    });

    const hasData = paces.some(p => p !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de données d\'allure</p>';
        return;
    }

    // Calculer les stats
    const validPaces = paces.filter(p => p !== null && p < 20); // Filtrer les valeurs aberrantes
    const avgPace = validPaces.reduce((a, b) => a + b, 0) / validPaces.length;
    const maxPace = Math.max(...validPaces);
    const minPace = Math.min(...validPaces);

    const formatPace = (pace) => {
        const min = Math.floor(pace);
        const sec = Math.round((pace - min) * 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    document.getElementById('paceStats').innerHTML = `
        <span>Moy: <strong>${formatPace(avgPace)} /km</strong></span>
        <span>Min: <strong>${formatPace(minPace)} /km</strong></span>
        <span>Max: <strong>${formatPace(maxPace)} /km</strong></span>
    `;

    detailCharts.pace = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Allure (min/km)',
                data: paces,
                borderColor: COLORS.amber,
                backgroundColor: `${COLORS.amber}33`,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y ? formatPace(item.parsed.y) + ' /km' : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Allure (min/km)' },
                    reverse: true, // Plus rapide en haut
                    ticks: {
                        callback: (value) => formatPace(value)
                    }
                }
            }
        }
    });
}

// Cadence
function displayDetailCadenceChart(streams) {
    const ctx = document.getElementById('detailCadenceChart');
    if (!ctx) return;

    if (detailCharts.cadence) {
        detailCharts.cadence.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const cadences = streams.map(s => s.cadence || null);

    const hasData = cadences.some(c => c !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de données de cadence</p>';
        return;
    }

    // Stats
    const validCadence = cadences.filter(c => c !== null);
    const avgCadence = (validCadence.reduce((a, b) => a + b, 0) / validCadence.length).toFixed(0);
    const maxCadence = Math.max(...validCadence);
    const minCadence = Math.min(...validCadence);

    document.getElementById('cadenceStats').innerHTML = `
        <span>Moy: <strong>${avgCadence} spm</strong></span>
        <span>Min: <strong>${minCadence} spm</strong></span>
        <span>Max: <strong>${maxCadence} spm</strong></span>
    `;

    detailCharts.cadence = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Cadence (spm)',
                data: cadences,
                borderColor: COLORS.moss,
                backgroundColor: `${COLORS.moss}33`,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y ? `${item.parsed.y.toFixed(0)} spm` : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Cadence (spm)' }
                }
            }
        }
    });
}

// Pente
function displayDetailGradeChart(streams) {
    const ctx = document.getElementById('detailGradeChart');
    if (!ctx) return;

    if (detailCharts.grade) {
        detailCharts.grade.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const grades = streams.map(s => s.grade_smooth || null);

    const hasData = grades.some(g => g !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de données de pente</p>';
        return;
    }

    // Stats
    const validGrades = grades.filter(g => g !== null);
    const avgGrade = (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1);
    const maxGrade = Math.max(...validGrades).toFixed(1);
    const minGrade = Math.min(...validGrades).toFixed(1);

    document.getElementById('gradeStats').innerHTML = `
        <span>Moy: <strong>${avgGrade}%</strong></span>
        <span>Min: <strong>${minGrade}%</strong></span>
        <span>Max: <strong>${maxGrade}%</strong></span>
    `;

    detailCharts.grade = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Pente (%)',
                data: grades,
                borderColor: COLORS.glacier,
                backgroundColor: (context) => {
                    const value = context.parsed.y;
                    return value >= 0 ? `${COLORS.glacier}33` : '#ff475733';
                },
                segment: {
                    borderColor: (context) => {
                        const value = context.p1.parsed.y;
                        return value >= 0 ? COLORS.glacier : '#ff4757';
                    }
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y !== null ? `${item.parsed.y.toFixed(1)}%` : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Pente (%)' }
                }
            }
        }
    });
}

// Puissance
function displayDetailPowerChart(streams) {
    const ctx = document.getElementById('detailPowerChart');
    if (!ctx) return;

    if (detailCharts.power) {
        detailCharts.power.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const power = streams.map(s => s.power || null);

    // Stats
    const validPower = power.filter(p => p !== null);
    if (validPower.length > 0) {
        const avgPower = (validPower.reduce((a, b) => a + b, 0) / validPower.length).toFixed(0);
        const maxPower = Math.max(...validPower);

        document.getElementById('powerStats').innerHTML = `
            <span>Moy: <strong>${avgPower} W</strong></span>
            <span>Max: <strong>${maxPower} W</strong></span>
        `;
    }

    detailCharts.power = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Puissance (W)',
                data: power,
                borderColor: '#ffa502',
                backgroundColor: '#ffa50233',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y ? `${item.parsed.y.toFixed(0)} W` : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Puissance (W)' }
                }
            }
        }
    });
}

// Température
function displayDetailTempChart(streams) {
    const ctx = document.getElementById('detailTempChart');
    if (!ctx) return;

    if (detailCharts.temp) {
        detailCharts.temp.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const temps = streams.map(s => s.temp || null);

    // Stats
    const validTemp = temps.filter(t => t !== null);
    if (validTemp.length > 0) {
        const avgTemp = (validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(1);
        const maxTemp = Math.max(...validTemp);
        const minTemp = Math.min(...validTemp);

        document.getElementById('tempStats').innerHTML = `
            <span>Moy: <strong>${avgTemp}°C</strong></span>
            <span>Min: <strong>${minTemp}°C</strong></span>
            <span>Max: <strong>${maxTemp}°C</strong></span>
        `;
    }

    detailCharts.temp = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Température (°C)',
                data: temps,
                borderColor: '#ff6348',
                backgroundColor: '#ff634833',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].label} km`,
                        label: (item) => item.parsed.y !== null ? `${item.parsed.y.toFixed(1)}°C` : 'N/A'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Température (°C)' }
                }
            }
        }
    });
}

// Retour à la liste des activités
function backToActivities() {
    // Nettoyer les graphiques
    Object.values(detailCharts).forEach(chart => {
        if (chart) chart.destroy();
    });
    detailCharts = {};

    // Nettoyer la carte
    if (detailMap) {
        detailMap.remove();
        detailMap = null;
    }

    showPage('activitiesPage');
}

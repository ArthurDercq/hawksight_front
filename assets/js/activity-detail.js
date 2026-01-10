// ============================================
// ACTIVITY DETAIL PAGE
// ============================================

let detailMap = null;
let detailCharts = {};

async function showActivityDetail(activityId) {
    showPage('activityDetailPage');

    const headers = getAuthHeaders();
    if (!headers) {
        console.error('Pas d authentification');
        return;
    }

    try {
        const data = await fetchWithCache(`${API_BASE}/activities/activity_detail/${activityId}`, { headers }, 600000);
        if (data.error) {
            console.error(data.error);
            return;
        }

        displayActivityDetail(data.activity, data.streams);

        // Configurer les boutons d'action avec l'ID de l'activité
        const editBtn = document.getElementById('detailEditBtn');
        const deleteBtn = document.getElementById('detailDeleteBtn');

        if (editBtn) {
            editBtn.onclick = () => openActivityModal(activityId);
        }

        if (deleteBtn) {
            deleteBtn.onclick = () => deleteActivity(activityId, data.activity.name || 'cette activité');
        }

        // Charger l'analyse avancée HR-Speed correlation
        await loadHrSpeedCorrelation(activityId);
    } catch (error) {
        console.error('Erreur chargement details activite:', error);
    }
}

function displayActivityDetail(activity, streams) {
    document.getElementById('detailActivityName').textContent = activity.name || 'Activite sans titre';

    const date = new Date(activity.start_date);
    const formattedDate = `${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'long' })} ${date.getFullYear()} a ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
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

    document.getElementById('detailDistance').textContent = `${(activity.distance || 0).toFixed(2)} km`;
    document.getElementById('detailDuration').textContent = activity.moving_time_hms || '--';
    document.getElementById('detailPace').textContent = activity.speed_minutes_per_km_hms ? `${activity.speed_minutes_per_km_hms} /km` : '--';
    document.getElementById('detailElevation').textContent = activity.total_elevation_gain ? `${Math.round(activity.total_elevation_gain)} m` : '--';
    document.getElementById('detailHeartrate').textContent = activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '--';
    document.getElementById('detailCadence').textContent = activity.average_cadence ? `${Math.round(activity.average_cadence)} spm` : '--';

    if (streams && streams.length > 0) {
        displayDetailMap(streams);
        displayDetailElevationChart(streams);
        displayDetailHeartrateChart(streams);
        displayDetailPaceChart(activity, streams);

        // Cadence uniquement pour le vélo
        if (activity.sport_type === 'Bike') {
            document.getElementById('detailCadenceCard').style.display = 'block';
            displayDetailCadenceChart(streams);
        } else {
            document.getElementById('detailCadenceCard').style.display = 'none';
        }

        displayDetailGradeChart(streams);

        // RCE (Running Cardiac Efficiency) uniquement pour courses > 3km avec données HR et vitesse
        const isRunning = activity.sport_type === 'Run' || activity.sport_type === 'Trail';
        const hasHR = streams.some(s => s.heartrate && s.heartrate > 0);
        const hasVelocity = streams.some(s => s.velocity_smooth && s.velocity_smooth > 0);
        const isLongEnough = activity.distance >= 3;

        if (isRunning && hasHR && hasVelocity && isLongEnough) {
            document.getElementById('detailRCECard').style.display = 'block';
            displayDetailRCEChart(streams);
        } else {
            document.getElementById('detailRCECard').style.display = 'none';
        }

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

function displayDetailMap(streams) {
    const mapContainer = document.getElementById('detailMap');

    if (detailMap) {
        detailMap.remove();
    }

    const coords = streams.filter(s => s.lat && s.lon).map(s => [s.lat, s.lon]);

    if (coords.length === 0) {
        mapContainer.innerHTML = '<p style="text-align: center; color: var(--color-steel);">Pas de donnees GPS disponibles</p>';
        return;
    }

    detailMap = L.map('detailMap').fitBounds(coords);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap);

    L.polyline(coords, {
        color: '#2563EB',
        weight: 3,
        opacity: 0.8
    }).addTo(detailMap);

    L.circleMarker(coords[0], {
        radius: 8,
        fillColor: COLORS.moss,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
    }).addTo(detailMap).bindPopup('Depart');

    L.circleMarker(coords[coords.length - 1], {
        radius: 8,
        fillColor: COLORS.glacier,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
    }).addTo(detailMap).bindPopup('Arrivee');
}

function displayDetailElevationChart(streams) {
    const ctx = document.getElementById('detailElevationChart');
    if (!ctx) return;

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
                legend: { display: false }
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

function displayDetailHeartrateChart(streams) {
    const ctx = document.getElementById('detailHeartrateChart');
    if (!ctx) return;

    if (detailCharts.heartrate) {
        detailCharts.heartrate.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const heartrates = streams.map(s => s.heartrate || null);

    const hasData = heartrates.some(hr => hr !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de donnees de frequence cardiaque</p>';
        return;
    }

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
                label: 'Frequence cardiaque (bpm)',
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
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: { title: { display: true, text: 'BPM' } }
            }
        }
    });
}

function displayDetailPaceChart(activity, streams) {
    const ctx = document.getElementById('detailPaceChart');
    if (!ctx) return;

    if (detailCharts.pace) {
        detailCharts.pace.destroy();
    }

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const paces = streams.map(s => {
        if (!s.velocity_smooth || s.velocity_smooth === 0) return null;
        const kmh = s.velocity_smooth * 3.6;
        return 60 / kmh;
    });

    const hasData = paces.some(p => p !== null);
    if (!hasData) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de donnees d allure</p>';
        return;
    }

    // Afficher la moyenne depuis l'activité
    document.getElementById('paceStats').innerHTML = `
        <span>Moy: <strong>${activity.speed_minutes_per_km_hms || '--'} /km</strong></span>
    `;

    detailCharts.pace = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Allure (min/km)',
                data: paces,
                borderColor: COLORS.glacier,
                backgroundColor: 'rgba(61, 178, 224, 0.2)',
                borderWidth: 2,
                fill: 'start',
                tension: 0.3,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pace = context.parsed.y;
                            if (pace == null || !isFinite(pace)) return '';
                            const minutes = Math.floor(pace);
                            const seconds = Math.round((pace - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 },
                    grid: { display: false }
                },
                y: {
                    title: { display: false },
                    reverse: true,
                    grid: { display: false },
                    min: 3,
                    max: 9,
                    ticks: {
                        callback: function(value) {
                            const minutes = Math.floor(value);
                            const seconds = Math.round((value - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }
                    }
                }
            }
        }
    });
}


function displayDetailCadenceChart(streams) {
    const ctx = document.getElementById('detailCadenceChart');
    if (!ctx) return;

    if (detailCharts.cadence) detailCharts.cadence.destroy();

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const cadences = streams.map(s => s.cadence || null);

    if (!cadences.some(c => c !== null)) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de donnees de cadence</p>';
        return;
    }

    detailCharts.cadence = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
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
            aspectRatio: 2.5,
            plugins: { legend: { display: false } },
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

function displayDetailGradeChart(streams) {
    const ctx = document.getElementById('detailGradeChart');
    if (!ctx) return;

    if (detailCharts.grade) detailCharts.grade.destroy();

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const grades = streams.map(s => s.grade_smooth || null);

    if (!grades.some(g => g !== null)) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de donnees de pente</p>';
        return;
    }

    detailCharts.grade = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                data: grades,
                borderColor: COLORS.glacier,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 2.5,
            plugins: { legend: { display: false } },
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

function displayDetailPowerChart(streams) {
    const ctx = document.getElementById('detailPowerChart');
    if (!ctx) return;

    if (detailCharts.power) detailCharts.power.destroy();

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const power = streams.map(s => s.power || null);

    detailCharts.power = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
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
            aspectRatio: 2.5,
            plugins: { legend: { display: false } },
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

function displayDetailTempChart(streams) {
    const ctx = document.getElementById('detailTempChart');
    if (!ctx) return;

    if (detailCharts.temp) detailCharts.temp.destroy();

    const distances = streams.map(s => (s.distance_m / 1000).toFixed(2));
    const temps = streams.map(s => s.temp || null);

    detailCharts.temp = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
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
            aspectRatio: 2.5,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    title: { display: true, text: 'Distance (km)' },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Temperature (°C)' }
                }
            }
        }
    });
}

function displayDetailRCEChart(streams) {
    const ctx = document.getElementById('detailRCEChart');
    if (!ctx) return;

    if (detailCharts.rce) detailCharts.rce.destroy();

    // Calculer le RCE avec fenêtres glissantes de 30 secondes
    const WINDOW_SIZE = 30; // secondes
    const rceData = calculateRCEWithSlidingWindow(streams, WINDOW_SIZE);

    if (rceData.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--color-steel); padding: 2rem;">Pas de données RCE disponibles</p>';
        return;
    }

    // Calculer statistiques
    const validRCE = rceData.map(d => d.rce).filter(v => v !== null && isFinite(v));
    const avgRCE = validRCE.reduce((sum, v) => sum + v, 0) / validRCE.length;

    document.getElementById('rceStats').innerHTML = `
        <span>Moyenne: <strong>${avgRCE.toFixed(3)} m/s/bpm</strong></span>
    `;

    detailCharts.rce = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rceData.map(d => d.time),
            datasets: [{
                label: 'RCE (m/s/bpm)',
                data: rceData.map(d => d.rce),
                borderColor: COLORS.moss,
                backgroundColor: 'rgba(109, 170, 117, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const rce = context.parsed.y;
                            if (rce == null || !isFinite(rce)) return '';
                            return `RCE: ${rce.toFixed(3)} m/s/bpm`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Temps (s)' },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: function(value) {
                            const seconds = rceData[value]?.time || value;
                            const minutes = Math.floor(seconds / 60);
                            const secs = Math.round(seconds % 60);
                            return `${minutes}:${secs.toString().padStart(2, '0')}`;
                        }
                    },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: 'RCE (m/s/bpm)' },
                    grid: { display: false }
                }
            }
        }
    });
}

function calculateRCEWithSlidingWindow(streams, windowSize) {
    const result = [];

    // Filtrer les streams pour ne garder que ceux avec HR et vitesse valides
    const validStreams = streams.filter(s =>
        s.time_s !== null &&
        s.heartrate && s.heartrate > 0 &&
        s.velocity_smooth && s.velocity_smooth > 0
    );

    if (validStreams.length === 0) return [];

    // Pour chaque position de départ de fenêtre
    for (let i = 0; i < validStreams.length; i++) {
        const startTime = validStreams[i].time_s;
        const endTime = startTime + windowSize;

        // Trouver tous les points dans la fenêtre [startTime, endTime]
        const windowData = validStreams.filter(s =>
            s.time_s >= startTime && s.time_s < endTime
        );

        if (windowData.length === 0) continue;

        // Calculer moyennes sur la fenêtre
        const avgHR = windowData.reduce((sum, s) => sum + s.heartrate, 0) / windowData.length;
        const avgVelocity = windowData.reduce((sum, s) => sum + s.velocity_smooth, 0) / windowData.length;

        // RCE = vitesse moyenne (m/s) / FC moyenne (bpm)
        const rce = avgVelocity / avgHR;

        // Utiliser le temps au milieu de la fenêtre
        const midTime = startTime + (windowSize / 2);

        if (isFinite(rce) && rce > 0) {
            result.push({
                time: Math.round(midTime),
                rce: rce
            });
        }
    }

    return result;
}

async function loadHrSpeedCorrelation(activityId) {
    const headers = getAuthHeaders();
    if (!headers) {
        return;
    }

    try {
        const data = await fetchWithCache(`${API_BASE}/analysis/rolling_hr_speed_correlation/${activityId}?window_seconds=180`, { headers }, 600000);
        if (data.error) {
            return;
        }

        if (!data.hr || !data.speed || data.hr.length === 0) {
            return;
        }

        document.getElementById('detailHrSpeedCorrelationCard').style.display = 'block';
        displayHrSpeedCorrelationChart(data);
    } catch (error) {
        // Silent error handling in production
    }
}

function displayHrSpeedCorrelationChart(data) {
    const ctx = document.getElementById('detailHrSpeedCorrelationChart');
    if (!ctx) return;

    if (detailCharts.hrSpeedCorrelation) {
        detailCharts.hrSpeedCorrelation.destroy();
    }

    const timeInMinutes = data.time.map(t => (t / 60).toFixed(1));

    const validCorrelations = data.correlation_pearson.filter(c => c !== null && !isNaN(c));
    const avgCorr = validCorrelations.length > 0
        ? (validCorrelations.reduce((a, b) => a + b, 0) / validCorrelations.length).toFixed(3)
        : 'N/A';
    const minCorr = validCorrelations.length > 0
        ? Math.min(...validCorrelations).toFixed(3)
        : 'N/A';
    const maxCorr = validCorrelations.length > 0
        ? Math.max(...validCorrelations).toFixed(3)
        : 'N/A';

    document.getElementById('hrSpeedCorrelationStats').innerHTML = `
        <span>Corrélation moyenne: <strong>${avgCorr}</strong></span>
        <span>Min: <strong>${minCorr}</strong></span>
        <span>Max: <strong>${maxCorr}</strong></span>
        <span>Moments critiques: <strong>${data.total_breakpoints}</strong></span>
    `;

    detailCharts.hrSpeedCorrelation = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeInMinutes,
            datasets: [
                {
                    label: 'Corrélation HR-Vitesse',
                    data: data.correlation_pearson,
                    borderColor: COLORS.glacier,
                    backgroundColor: `${COLORS.glacier}33`,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y-correlation'
                },
                {
                    label: 'HR normalisée',
                    data: data.hr_normalized,
                    borderColor: COLORS.amber,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y-normalized',
                    hidden: true
                },
                {
                    label: 'Vitesse normalisée',
                    data: data.speed_normalized,
                    borderColor: COLORS.moss,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y-normalized',
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#E8E9EB',
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            if (data.breakpoints.includes(data.time[index])) {
                                return '⚠️ Moment critique détecté';
                            }
                            return '';
                        }
                    }
                },
                annotation: {
                    annotations: data.breakpoints.map(bp => ({
                        type: 'line',
                        xMin: (bp / 60).toFixed(1),
                        xMax: (bp / 60).toFixed(1),
                        borderColor: 'rgba(255, 99, 71, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            display: false
                        }
                    }))
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Temps (minutes)',
                        color: '#E8E9EB'
                    },
                    ticks: {
                        maxTicksLimit: 15,
                        color: '#E8E9EB'
                    },
                    grid: {
                        color: '#3A3F4733'
                    }
                },
                'y-correlation': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Corrélation Pearson',
                        color: '#E8E9EB'
                    },
                    min: -1,
                    max: 1,
                    ticks: {
                        color: '#E8E9EB'
                    },
                    grid: {
                        color: '#3A3F4733'
                    }
                },
                'y-normalized': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Valeurs normalisées (z-score)',
                        color: '#E8E9EB'
                    },
                    ticks: {
                        color: '#E8E9EB'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function backToActivities() {
    Object.values(detailCharts).forEach(chart => {
        if (chart) chart.destroy();
    });
    detailCharts = {};

    if (detailMap) {
        detailMap.remove();
        detailMap = null;
    }

    showPage('activitiesPage');
}

/**
 * Gestion CRUD des activités
 */

let editingActivityId = null;

// Ouvrir la modale pour créer une nouvelle activité
function openActivityModal(activityId = null) {
    const modal = document.getElementById('activityModal');
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');
    const form = document.getElementById('activityForm');

    // Reset du formulaire
    form.reset();
    editingActivityId = activityId;

    if (activityId) {
        // Mode édition
        modalTitle.textContent = 'Modifier l\'activité';
        saveBtn.textContent = 'Enregistrer les modifications';
        loadActivityForEdit(activityId);
    } else {
        // Mode création
        modalTitle.textContent = 'Nouvelle activité';
        saveBtn.textContent = 'Créer l\'activité';

        // Pré-remplir la date avec l'heure actuelle
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('activityDate').value = now.toISOString().slice(0, 16);
    }

    modal.style.display = 'flex';
}

// Fermer la modale
function closeActivityModal() {
    const modal = document.getElementById('activityModal');
    modal.style.display = 'none';
    editingActivityId = null;
}

// Charger une activité pour l'éditer
async function loadActivityForEdit(activityId) {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/activities/activities/${activityId}`, { headers });
        if (response.ok) {
            const activity = await response.json();

            // Remplir le formulaire
            document.getElementById('activityName').value = activity.name || '';
            document.getElementById('activitySport').value = activity.sport_type || 'Run';

            // Convertir la date ISO en format datetime-local
            if (activity.start_date) {
                const date = new Date(activity.start_date);
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                document.getElementById('activityDate').value = date.toISOString().slice(0, 16);
            }

            document.getElementById('activityDistance').value = activity.distance || '';
            document.getElementById('activityMovingTime').value = activity.moving_time || '';
            document.getElementById('activityElevation').value = activity.total_elevation_gain || '';
            document.getElementById('activityHeartrate').value = activity.average_heartrate || '';
            document.getElementById('activityMaxHeartrate').value = activity.max_heartrate || '';
            document.getElementById('activityCadence').value = activity.average_cadence || '';
        } else {
            alert('Erreur lors du chargement de l\'activité');
            closeActivityModal();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement de l\'activité');
        closeActivityModal();
    }
}

// Sauvegarder une activité (création ou mise à jour)
async function saveActivity(event) {
    event.preventDefault();

    const headers = getAuthHeaders();
    if (!headers) return;

    // Construire l'objet activité à partir du formulaire
    const activityData = {
        name: document.getElementById('activityName').value,
        sport_type: document.getElementById('activitySport').value,
        start_date: document.getElementById('activityDate').value,
        distance: parseFloat(document.getElementById('activityDistance').value),
        moving_time: parseFloat(document.getElementById('activityMovingTime').value)
    };

    // Ajouter les champs optionnels s'ils sont renseignés
    const elevation = document.getElementById('activityElevation').value;
    if (elevation) activityData.total_elevation_gain = parseFloat(elevation);

    const heartrate = document.getElementById('activityHeartrate').value;
    if (heartrate) {
        activityData.average_heartrate = parseFloat(heartrate);
        activityData.has_heartrate = true;
    }

    const maxHeartrate = document.getElementById('activityMaxHeartrate').value;
    if (maxHeartrate) activityData.max_heartrate = parseFloat(maxHeartrate);

    const cadence = document.getElementById('activityCadence').value;
    if (cadence) activityData.average_cadence = parseFloat(cadence);

    try {
        let response;
        if (editingActivityId) {
            // Mise à jour
            response = await fetch(`${API_BASE}/activities/activities/${editingActivityId}`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activityData)
            });
        } else {
            // Création
            response = await fetch(`${API_BASE}/activities/activities`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activityData)
            });
        }

        if (response.ok) {
            closeActivityModal();
            // Recharger la liste des activités
            await loadActivities();
            showNotification(editingActivityId ? 'Activité modifiée avec succès !' : 'Activité créée avec succès !', 'success');
        } else {
            const error = await response.json();
            alert(`Erreur : ${error.detail || 'Une erreur est survenue'}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde de l\'activité');
    }
}

// Supprimer une activité
async function deleteActivity(activityId, activityName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${activityName}" ?\n\n⚠️ Cette action est irréversible et impactera vos statistiques.`)) {
        return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/activities/activities/${activityId}?delete_streams=true`, {
            method: 'DELETE',
            headers
        });

        if (response.status === 204 || response.ok) {
            // Recharger la liste des activités
            await loadActivities();
            showNotification('Activité supprimée avec succès', 'success');
        } else {
            const error = await response.json();
            alert(`Erreur : ${error.detail || 'Une erreur est survenue'}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression de l\'activité');
    }
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);

    // Retirer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fermer la modale en cliquant en dehors
window.addEventListener('click', (event) => {
    const modal = document.getElementById('activityModal');
    if (event.target === modal) {
        closeActivityModal();
    }
});

// Fermer avec la touche Echap
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeActivityModal();
    }
});

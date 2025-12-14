/**
 * Gestion de la page profil utilisateur
 */

/**
 * Charge et affiche les données du profil utilisateur
 */
async function loadUserProfile() {
    const headers = getAuthHeaders();

    if (!headers) {
        console.error('Utilisateur non connecté');
        showPage('homePage');
        return;
    }

    // Pour l'instant, utiliser user_id=1 par défaut (système multi-user à implémenter)
    const userId = 1;

    try {
        const response = await fetch(`${API_BASE}/auth/strava/profile?user_id=${userId}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement du profil');
        }

        const profile = await response.json();
        displayUserProfile(profile);

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        // Afficher un profil par défaut en cas d'erreur
        displayDefaultProfile();
    }
}

/**
 * Affiche un profil par défaut si les données ne sont pas disponibles
 */
function displayDefaultProfile() {
    document.getElementById('profileAvatar').src = 'assets/images/HawkSight_transparent_Couleur.png';
    document.getElementById('profileName').textContent = 'Utilisateur HawkSight';
    document.getElementById('profileLocation').textContent = 'Non renseigné';
    document.getElementById('profileEmail').textContent = 'Non renseigné';
    document.getElementById('profileActivitiesCount').textContent = '-';
    document.getElementById('profileMemberSince').textContent = '-';
    document.getElementById('profileStreamsCount').textContent = '-';
    document.getElementById('profileLastSync').textContent = '-';
    document.getElementById('profileStravaId').textContent = '-';
    document.getElementById('profileEmailDetail').textContent = 'Non renseigné';
    document.getElementById('profileSex').textContent = 'Non renseigné';
}

/**
 * Affiche les données du profil dans la page
 * @param {Object} profile - Données du profil utilisateur
 */
function displayUserProfile(profile) {
    // Photo de profil
    const avatar = document.getElementById('profileAvatar');
    if (profile.profile_picture) {
        avatar.src = profile.profile_picture;
        avatar.alt = `Photo de ${profile.firstname} ${profile.lastname}`;
    } else {
        // Image par défaut si pas de photo
        avatar.src = 'assets/images/HawkSight_transparent_Couleur.png';
        avatar.alt = 'Photo de profil par défaut';
    }

    // Nom complet
    const name = document.getElementById('profileName');
    if (profile.firstname && profile.lastname) {
        name.textContent = `${profile.firstname} ${profile.lastname}`;
    } else if (profile.username) {
        name.textContent = profile.username;
    } else {
        name.textContent = 'Utilisateur';
    }

    // Localisation
    const location = document.getElementById('profileLocation');
    const locationParts = [];
    if (profile.city) locationParts.push(profile.city);
    if (profile.country) locationParts.push(profile.country);
    location.textContent = locationParts.length > 0 ? locationParts.join(', ') : 'Non renseigné';

    // Badge premium
    const premium = document.getElementById('profilePremium');
    if (profile.premium) {
        premium.innerHTML = '<span class="profile-premium-badge">Premium</span>';
    } else {
        premium.innerHTML = '';
    }

    // Email
    const email = document.getElementById('profileEmail');
    email.textContent = profile.email_address || 'Non renseigné';

    // Statistiques - Nombre d'activités
    const activitiesCount = document.getElementById('profileActivitiesCount');
    activitiesCount.textContent = profile.activities_count || 0;

    // Membre depuis
    const memberSince = document.getElementById('profileMemberSince');
    if (profile.created_at) {
        const date = new Date(profile.created_at);
        const now = new Date();
        const years = now.getFullYear() - date.getFullYear();
        const months = now.getMonth() - date.getMonth();

        if (years > 0) {
            memberSince.textContent = `${years} an${years > 1 ? 's' : ''}`;
        } else if (months > 0) {
            memberSince.textContent = `${months} mois`;
        } else {
            memberSince.textContent = 'Nouveau';
        }
    } else {
        memberSince.textContent = '-';
    }

    // Streams enregistrés
    const streamsCount = document.getElementById('profileStreamsCount');
    streamsCount.textContent = profile.streams_count || 0;

    // Dernière synchronisation
    const lastSync = document.getElementById('profileLastSync');
    if (profile.last_sync_at) {
        const syncDate = new Date(profile.last_sync_at);
        const now = new Date();
        const diffMs = now - syncDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            lastSync.textContent = `Il y a ${diffMins} min`;
        } else if (diffHours < 24) {
            lastSync.textContent = `Il y a ${diffHours}h`;
        } else {
            lastSync.textContent = `Il y a ${diffDays}j`;
        }
    } else {
        lastSync.textContent = 'Jamais';
    }

    // Détails du compte
    const stravaId = document.getElementById('profileStravaId');
    stravaId.textContent = profile.strava_id || '-';

    const emailDetail = document.getElementById('profileEmailDetail');
    emailDetail.textContent = profile.email_address || 'Non renseigné';

    const sex = document.getElementById('profileSex');
    if (profile.sex === 'M') {
        sex.textContent = 'Homme';
    } else if (profile.sex === 'F') {
        sex.textContent = 'Femme';
    } else {
        sex.textContent = 'Non renseigné';
    }

    const status = document.getElementById('profileStatus');
    status.textContent = profile.is_active ? 'Actif' : 'Inactif';
    status.style.color = profile.is_active ? 'var(--color-moss)' : '#ff4444';
}

/**
 * Initialise la page profil lors de l'affichage
 */
function initProfilePage() {
    loadUserProfile();
}

# HawkSight — Frontend Handoff

Ce document décrit tous les changements d'architecture backend à implémenter côté frontend,
ainsi qu'une référence complète des endpoints disponibles.

---

## 1. Changements breaking (à implémenter en priorité)

### 1.1 Nouveau flux OAuth2 — callback avec code éphémère

**Avant :**
```
Strava → /auth/callback?token={jwt}
→ stocker le JWT directement
```

**Maintenant :**
```
Strava → /auth/callback?code={temp_code}   ← code éphémère, valide 2 min, usage unique
→ POST /auth/strava/exchange-code?code={temp_code}
→ { access_token, token_type: "bearer" }
→ stocker le JWT
```

Le frontend doit détecter le paramètre `?code=` dans l'URL de callback et appeler
`exchange-code` immédiatement. Ne pas confondre avec le `?code=` de Strava — le backend
le gère en interne et redirige avec son propre code éphémère.

### 1.2 Écran "invitation requise" (403)

Si un utilisateur tente de s'inscrire sans code d'invitation valide, le backend retourne
une `403` avec `detail: "Invalid or already used invitation code."`.

Le frontend doit afficher un écran explicatif : l'app est en bêta privée, il faut un lien
d'invitation. Ne pas afficher une erreur générique.

Flux avec invitation :
```
Admin génère → /auth/strava/admin/invites (POST) → { code, invite_url }
invite_url = https://frontend.com/auth/strava/login?invite={code}
→ GET /auth/strava/login?invite={code} → authorization_url Strava avec code encodé
```

### 1.3 `streams_count` → `features_count`

Les endpoints `/auth/strava/profile` et `/auth/strava/sync-status` retournent maintenant
`features_count` (nombre d'activités avec features calculées) à la place de `streams_count`.

```json
// Avant
{ "streams_count": 686 }

// Maintenant
{ "features_count": 686 }
```

### 1.4 Loader d'onboarding pour les nouveaux utilisateurs

Après la première connexion d'un nouvel utilisateur, le backend enqueue automatiquement
un pipeline de sync qui prend plusieurs minutes. Le frontend doit :

1. Après `exchange-code`, appeler `GET /auth/strava/sync-status`
2. Si `activities_count === 0` → afficher un écran "Synchronisation en cours"
3. Poller `GET /sync/status` toutes les 5 secondes
4. Afficher la progression : `current_job.type` + `current_job.progress` (0-100)
5. Quand `is_syncing === false` et `activities_count > 0` → rediriger vers le dashboard

**Types de jobs à afficher :**
| `type` | Message à afficher |
|--------|--------------------|
| `initial_sync_metadata` | Récupération de vos activités... |
| `sync_streams_chunk` | Calcul des données GPS... |
| `compute_kpis` | Calcul de vos statistiques... |
| `compute_exploration` | Cartographie de vos zones... |

---

## 2. Flux d'authentification complet

```
1. GET /auth/strava/login?invite={code?}
   → { authorization_url, invite_required: bool }

2. Redirect vers authorization_url (Strava)

3. Strava redirect vers https://frontend.com/auth/callback?code={temp_code}

4. POST /auth/strava/exchange-code?code={temp_code}
   → { access_token: "eyJ...", token_type: "bearer" }

5. Stocker le JWT (localStorage ou secure cookie)
   Header pour toutes les requêtes suivantes :
   Authorization: Bearer {access_token}

6. Vérifier si onboarding nécessaire :
   GET /auth/strava/sync-status
   Si activities_count === 0 → afficher loader, poller /sync/status

7. Logout : supprimer le JWT localement (GET /auth/strava/logout optionnel)
```

---

## 3. Endpoints — référence complète

### Auth (`/auth/strava`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/auth/strava/login` | Non | Retourne `authorization_url` + `invite_required`. Query: `invite?` |
| GET | `/auth/strava/callback` | Non | Géré par Strava, redirige vers frontend avec `?code=` |
| POST | `/auth/strava/exchange-code` | Non | Échange le code éphémère contre un JWT. Query: `code` (requis) |
| GET | `/auth/strava/me` | JWT | Infos de l'utilisateur connecté |
| GET | `/auth/strava/profile` | JWT | Profil complet avec données Strava athlete + `activities_count`, `features_count` |
| GET | `/auth/strava/sync-status` | JWT | `{ user_id, strava_id, last_sync_at, activities_count, features_count, is_syncing }` |
| GET | `/auth/strava/logout` | JWT | Client doit supprimer le JWT localement |
| POST | `/auth/strava/admin/invites` | JWT Admin | Génère un code d'invitation. Query: `note?`, `email?` |
| GET | `/auth/strava/admin/invites` | JWT Admin | Liste tous les codes d'invitation |

### Sync / Jobs (`/sync`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/sync/status` | JWT | `{ is_syncing, current_job: { type, progress, status }, last_completed, has_error }` — poller toutes les 5s pendant onboarding |
| GET | `/sync/jobs` | JWT | Historique des jobs de l'utilisateur |
| POST | `/sync/trigger` | JWT | Déclenche une sync incrémentale manuelle (bloqué pour les users demo) |

### Activités (`/activities`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/activities/activities` | JWT | Liste paginée. Query: `limit` (1-500), `offset` |
| GET | `/activities/activities/{activity_id}` | JWT | Activité par ID |
| GET | `/activities/activity_detail/{activity_id}` | JWT | Détail complet : activity + streams + exploration + trail_stats + race |
| GET | `/activities/recent` | JWT | N dernières activités avec polyline_coords. Query: `n` (3-50) |
| GET | `/activities/last_activity` | JWT | Dernière activité. Query: `sport_type?` |
| GET | `/activities/filter_activities` | JWT | Filtre. Query: `sport_type?`, `start_date?`, `end_date?` (YYYY-MM-DD) |
| GET | `/activities/activity_streams` | JWT | Streams d'une activité. Query: `activity_id` (requis) |
| POST | `/activities/update_db` | JWT | Sync nouvelles activités depuis Strava |

### KPI & Records (`/kpi`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/kpi/` | JWT | KPIs globaux. Query: `start_date?`, `end_date?` |
| GET | `/kpi/streak` | JWT | Streak hebdomadaire (1 activité + 5km Run/Trail/semaine) |
| GET | `/kpi/records` | JWT | Tous les records perso (distance, dénivelé, KV) |
| PUT | `/kpi/records/{record_id}/exclude` | JWT | Toggle exclusion d'un record du Trail Score |

### Analyse (`/analysis`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/analysis/trail/{activity_id}` | JWT | Analyse trail complète (run/walk scatter, VAM, efficacité, découplage) |
| GET | `/analysis/rolling_hr_speed_correlation/{activity_id}` | JWT | Corrélation HR/vitesse. Query: `window_seconds` (30-600, def 180) |
| POST | `/analysis/trail/upload` | JWT | Analyse depuis fichier FIT/GPX uploadé |

### Visualisations (`/plot`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/plot/weekly_bar` | JWT | Barres hebdomadaires. Query: `value_col`, `weeks`, `sport_types[]?`, `year?` |
| GET | `/plot/weekly_summary` | JWT | Résumé semaine (distance, D+, durée). Query: `weeks`, `year?`, `sport_types[]?` |
| GET | `/plot/weekly_pace` | JWT | Allure hebdomadaire moyenne. Query: `weeks`, `sport_types[]?`, `year?` |
| GET | `/plot/calendar_heatmap` | JWT | Heatmap calendrier |
| GET | `/plot/daily_hours_bar` | JWT | Barres journalières d'une semaine. Query: `week_offset` |
| GET | `/plot/poster_dplus` | JWT | Données profil dénivelé. Query: `n`, `sport_type[]?` |
| GET | `/plot/repartition_run` | JWT | Répartition par sport. Query: `sport_type[]?`, `weeks` |

### Exploration (`/exploration`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/exploration/` | JWT | GeoJSON hexagones explorés. Query: `sport?` (run/trail/walk/bike/all), `year?` |
| GET | `/exploration/stats` | JWT | Stats d'exploration. Query: `year?`, `month?`, `period?` (week/month/year) |
| GET | `/exploration/activity/{activity_id}` | JWT | Exploration d'une activité : `{ exploration_rate, new_cells, total_cells }` |
| GET | `/exploration/rates` | JWT | Taux d'exploration par période. Query: `period`, `sport`, `year?` |
| GET | `/exploration/territories/largest` | JWT | Top N plus grandes zones (GeoJSON ou 202 si calcul en cours). Query: `top_n`, `sport?` |
| GET | `/exploration/territories/unexplored` | JWT | Zones inexplorées proches (GeoJSON ou 202). Query: `top_n` |
| POST | `/exploration/territories/refresh` | JWT | Force recalcul des territoires |

### Trail Score (`/trail`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/trail/profile` | JWT | Profil radar actuel (axis_scores, score global) |
| POST | `/trail/compute` | JWT | Lance le calcul async (retourne 202) |
| GET | `/trail/history` | JWT | Historique du Trail Score. Query: `weeks` (1-260, def 52) |
| GET | `/trail/references` | JWT | Profils de référence (Kilian, François, etc.) |
| GET | `/trail/references/{slug}` | JWT | Un profil de référence par slug |

### Tags (`/tags`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/tags/` | JWT | Liste tous les tags |
| POST | `/tags/` | JWT | Créer un tag. Body: `{ name, color? }` |
| GET | `/tags/activity/{activity_id}` | JWT | Tags d'une activité |
| POST | `/tags/activity/add` | JWT | Ajouter un tag à une activité. Body: `{ activity_id, tag_id }` |
| POST | `/tags/activity/remove` | JWT | Retirer un tag d'une activité |

### Events / Courses (`/events`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/events/` | JWT | Liste les events de l'utilisateur |
| POST | `/events/` | JWT | Créer un event |
| PUT | `/events/{event_id}` | JWT | Modifier un event |
| PUT | `/events/{event_id}/link` | JWT | Lier/délier une activité à un event. Body: `{ activity_id: int \| null }` |
| DELETE | `/events/{event_id}` | JWT | Supprimer un event |

### Santé

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/health` | Non | `{ status, checks: { db, worker } }` — 200 OK ou 503 |
| GET | `/` | Non | Infos API et URLs OAuth2 |

---

## 4. Gestion des erreurs

| Code | Cas |
|------|-----|
| 400 | Paramètre invalide, format de date incorrect |
| 401 | JWT manquant, expiré ou invalide |
| 403 | Code d'invitation invalide / déjà utilisé — afficher écran dédié |
| 403 | User demo qui tente une action bloquée |
| 404 | Ressource introuvable |
| 202 | Calcul en cours (exploration territories, trail compute) — poller |
| 503 | Backend dégradé (DB ou worker down) |

---

## 5. Comportements asynchrones à gérer

Certains endpoints retournent **202 Accepted** quand un calcul est en cours.
Le frontend doit gérer ces cas avec un état de chargement + retry.

| Endpoint | 202 quand | Que faire |
|----------|-----------|-----------|
| `GET /exploration/territories/largest` | Snapshot en cours de calcul | Afficher loader, retry après 10s |
| `GET /exploration/territories/unexplored` | Snapshot en cours de calcul | Afficher loader, retry après 10s |
| `POST /trail/compute` | Toujours | Poller `GET /trail/profile` jusqu'à obtenir un résultat |
| `GET /sync/status` | `is_syncing: true` | Poller toutes les 5s, afficher `current_job.progress` |

---

## 6. Restrictions users demo

Les users avec `role: "demo"` ont accès en lecture seule. Ces endpoints retournent 403 :
- Toutes les mutations d'activités (POST/PUT/DELETE)
- Création/modification de tags et events
- `POST /sync/trigger`
- `POST /activities/update_db`

Le frontend doit afficher les actions comme désactivées avec un badge "Mode démo".

---

## 7. Variables d'environnement frontend à configurer

```env
VITE_API_URL=https://api.hawksight.io          # URL du backend
VITE_FRONTEND_URL=https://app.hawksight.io     # URL du frontend (pour redirects OAuth)
```

La `FRONTEND_URL` doit correspondre exactement à ce qui est configuré dans :
- La variable Render `FRONTEND_URL` du backend
- La Strava Developer Console (Authorized Callback Domain)

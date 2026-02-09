"""
Trail Analysis Module for HawkSight
====================================
Analyse approfondie des activités trail/running.

Ce module contient toutes les fonctions de calcul pour:
1. Temps aux ravitaillements (aid stations)
2. Analyse Run vs Walk (scatter plot)
3. Comparaison VAM des montées (auto-détection)
4. Efficacité / Drift sur la course
5. Décorrélation physiologique (decoupling)
6. Profil de force (GAP par gradient)

Usage:
    from trail_analysis import TrailAnalyzer

    analyzer = TrailAnalyzer(df)  # df = DataFrame avec les données GPS/cardio
    result = analyzer.run_full_analysis()
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from typing import List, Optional, Tuple
from datetime import datetime


# =============================================================================
# DATA CLASSES - Structures de données pour les résultats
# =============================================================================

@dataclass
class AidStation:
    name: str
    duration_min: float
    km_point: float
    start_time: str
    end_time: str


@dataclass
class RunWalkPoint:
    slope: float
    speed_kmh: float
    cadence: float


@dataclass
class ClimbVAM:
    climb_name: str
    vam: float
    avg_hr: float
    elev_gain: float
    start_km: float
    end_km: float


@dataclass
class EfficiencyPoint:
    time_min: float
    efficiency: float
    altitude: float


@dataclass
class EfficiencyResult:
    start_avg: float
    end_avg: float
    loss_pct: float
    timeseries: List[EfficiencyPoint]


@dataclass
class DecouplingPoint:
    time: str
    hr: float
    gap_speed: float
    rolling_corr: float


@dataclass
class DecouplingResult:
    peak_hr: float
    peak_hr_time: str
    timeseries: List[DecouplingPoint]


@dataclass
class ForceProfilePoint:
    slope_bin: int
    gap_pace_min_km: float


@dataclass
class TrailAnalysisResult:
    """Résultat complet de l'analyse trail"""
    activity_name: str
    distance_km: float
    duration_seconds: float
    elevation_gain: float

    aid_stations: List[AidStation]
    run_walk_data: List[RunWalkPoint]
    vam_comparison: List[ClimbVAM]
    efficiency: EfficiencyResult
    decoupling: Optional[DecouplingResult]
    force_profile: List[ForceProfilePoint]

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour JSON serialization"""
        return asdict(self)


# =============================================================================
# HELPER FUNCTIONS - Fonctions utilitaires
# =============================================================================

def calculate_energy_cost(slope_percent: float) -> float:
    """
    Calcule le coût énergétique relatif basé sur la pente.
    Formule basée sur les recherches de Minetti et al.

    Args:
        slope_percent: Pente en pourcentage (ex: 10 pour 10%)

    Returns:
        Coût énergétique relatif (1.0 = plat)
    """
    g = slope_percent / 100  # Convertit en fraction

    # Formule polynomiale du coût énergétique
    # Source: Minetti et al. (2002) - simplifiée
    cost = 155.4 * g**5 - 30.4 * g**4 - 43.3 * g**3 + 46.3 * g**2 + 19.5 * g + 3.6

    # Normalise par rapport au plat (3.6 J/kg/m)
    return max(cost / 3.6, 0.5)  # Minimum 0.5 pour éviter division par zéro


def calculate_cumulative_gain(altitude_series: pd.Series, threshold: float = 0.5) -> float:
    """
    Calcule le dénivelé positif cumulé.

    Args:
        altitude_series: Série pandas des altitudes
        threshold: Seuil minimum pour compter comme montée (en mètres)

    Returns:
        Dénivelé positif total en mètres
    """
    diffs = altitude_series.diff()
    climbs = diffs[diffs > threshold]
    return climbs.sum() if len(climbs) > 0 else 0


def smooth_series(series: pd.Series, window: int = 25) -> pd.Series:
    """
    Lisse une série avec une moyenne mobile.

    Args:
        series: Série à lisser
        window: Taille de la fenêtre

    Returns:
        Série lissée
    """
    smoothed = series.rolling(window=window, center=True).mean()
    return smoothed.ffill().bfill()


# =============================================================================
# MAIN ANALYZER CLASS
# =============================================================================

class TrailAnalyzer:
    """
    Analyseur complet pour activités trail/running.

    Attend un DataFrame avec les colonnes suivantes:
    - timestamp (index ou colonne): datetime
    - distance: distance en mètres
    - speed: vitesse en m/s
    - altitude (ou enhanced_altitude): altitude en mètres
    - heart_rate: fréquence cardiaque en bpm
    - cadence: cadence en cycles/min (sera convertie en SPM si nécessaire)
    - latitude, longitude: coordonnées GPS (optionnel)
    """

    def __init__(self, df: pd.DataFrame, activity_name: str = "Trail Activity"):
        """
        Initialise l'analyseur avec les données d'activité.

        Args:
            df: DataFrame avec les données de l'activité
            activity_name: Nom de l'activité
        """
        self.activity_name = activity_name
        self.df = self._prepare_dataframe(df.copy())

    def _prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prépare et nettoie le DataFrame.
        """
        # Assure que timestamp est l'index
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.set_index('timestamp')

        # Utilise enhanced_altitude si altitude n'existe pas
        if 'altitude' not in df.columns and 'enhanced_altitude' in df.columns:
            df['altitude'] = df['enhanced_altitude']

        # Convertit la cadence en SPM si nécessaire
        if 'cadence' in df.columns:
            if df['cadence'].median() < 100:
                df['cadence'] = df['cadence'] * 2

        # Calcule la vitesse en km/h
        if 'speed' in df.columns:
            df['speed_kmh'] = df['speed'] * 3.6

        # Calcule la pente
        df['delta_alt'] = df['altitude'].diff()
        df['delta_dist'] = df['distance'].diff().replace(0, np.nan)
        df['slope_raw'] = (df['delta_alt'] / df['delta_dist']) * 100
        df['slope_smooth'] = smooth_series(df['slope_raw'], window=25)
        df['slope_smooth'] = df['slope_smooth'].clip(-50, 50).fillna(0)

        # Calcule le GAP (Grade Adjusted Pace)
        df['energy_cost'] = df['slope_smooth'].apply(calculate_energy_cost)
        df['gap_speed'] = df['speed'] * df['energy_cost']

        # Interpole les valeurs manquantes
        cols_to_fix = ['heart_rate', 'speed', 'altitude', 'cadence']
        for col in cols_to_fix:
            if col in df.columns:
                df[col] = df[col].interpolate(method='linear').ffill().bfill()

        return df

    # =========================================================================
    # 1. ANALYSE DES TEMPS AUX RAVITAILLEMENTS
    # =========================================================================

    def analyze_aid_stations(
        self,
        stop_threshold_kmh: float = 2.0,
        min_duration_minutes: float = 5.0
    ) -> List[AidStation]:
        """
        Détecte les arrêts aux ravitaillements basé sur la vitesse.

        Args:
            stop_threshold_kmh: Vitesse en dessous de laquelle on considère un arrêt
            min_duration_minutes: Durée minimum pour considérer comme ravito

        Returns:
            Liste des ravitaillements détectés
        """
        df = self.df.copy()

        # Marque les points comme arrêt ou non
        df['is_stopped'] = df['speed_kmh'] < stop_threshold_kmh

        # Groupe les périodes consécutives
        df['group_id'] = (df['is_stopped'] != df['is_stopped'].shift()).cumsum()

        aid_stations = []

        for group_id, group_data in df.groupby('group_id'):
            if group_data['is_stopped'].iloc[0]:
                start_time = group_data.index[0]
                end_time = group_data.index[-1]
                duration = (end_time - start_time).total_seconds() / 60

                if duration >= min_duration_minutes:
                    km_point = group_data['distance'].mean() / 1000

                    aid_stations.append(AidStation(
                        name=f"Ravito km {int(round(km_point))}",
                        duration_min=round(duration, 1),
                        km_point=round(km_point, 2),
                        start_time=start_time.isoformat(),
                        end_time=end_time.isoformat()
                    ))

        return aid_stations

    # =========================================================================
    # 2. ANALYSE RUN VS WALK
    # =========================================================================

    def analyze_run_walk(
        self,
        min_speed_kmh: float = 1.0,
        max_speed_kmh: float = 25.0,
        min_cadence: float = 30
    ) -> List[RunWalkPoint]:
        """
        Extrait les données pour le scatter plot Run vs Walk.

        Args:
            min_speed_kmh: Vitesse minimum à inclure
            max_speed_kmh: Vitesse maximum à inclure
            min_cadence: Cadence minimum à inclure

        Returns:
            Liste de points (slope, speed, cadence)
        """
        df = self.df.copy()

        # Filtre les données valides
        mask = (
            (df['speed_kmh'] > min_speed_kmh) &
            (df['speed_kmh'] < max_speed_kmh) &
            (df['slope_smooth'] > -35) &
            (df['slope_smooth'] < 35)
        )

        if 'cadence' in df.columns:
            mask &= df['cadence'] > min_cadence

        df_filtered = df[mask]

        # Échantillonne pour réduire le volume (max 2000 points)
        if len(df_filtered) > 2000:
            df_filtered = df_filtered.sample(n=2000, random_state=42)

        points = []
        for _, row in df_filtered.iterrows():
            points.append(RunWalkPoint(
                slope=round(row['slope_smooth'], 1),
                speed_kmh=round(row['speed_kmh'], 2),
                cadence=round(row.get('cadence', 0), 0)
            ))

        return points

    # =========================================================================
    # 3. DÉTECTION AUTO ET ANALYSE VAM DES MONTÉES
    # =========================================================================

    def _detect_climbs(
        self,
        min_elevation_gain: float = 100,
        min_gradient: float = 3.0,
        smoothing_window: int = 100
    ) -> List[dict]:
        """
        Détecte automatiquement les montées significatives.

        Args:
            min_elevation_gain: D+ minimum pour considérer comme montée
            min_gradient: Pente moyenne minimum (%)
            smoothing_window: Fenêtre de lissage pour l'altitude

        Returns:
            Liste des segments de montée détectés
        """
        df = self.df.copy()

        # Lisse l'altitude pour éviter le bruit
        df['alt_smooth'] = smooth_series(df['altitude'], window=smoothing_window)

        # Calcule le gradient lissé
        df['gradient'] = df['alt_smooth'].diff() / df['distance'].diff().replace(0, np.nan) * 100
        df['gradient'] = smooth_series(df['gradient'], window=50).fillna(0)

        # Identifie les zones de montée (gradient > seuil)
        df['is_climbing'] = df['gradient'] > min_gradient
        df['climb_group'] = (df['is_climbing'] != df['is_climbing'].shift()).cumsum()

        climbs = []
        climb_count = 0

        for group_id, group_data in df.groupby('climb_group'):
            if not group_data['is_climbing'].iloc[0]:
                continue

            # Calcule le D+ du segment
            elev_gain = calculate_cumulative_gain(group_data['alt_smooth'])

            if elev_gain >= min_elevation_gain:
                climb_count += 1
                start_km = group_data['distance'].iloc[0] / 1000
                end_km = group_data['distance'].iloc[-1] / 1000

                # Génère un nom basé sur l'altitude max
                max_alt = group_data['alt_smooth'].max()
                name = f"Montée {climb_count} ({int(max_alt)}m)"

                climbs.append({
                    'name': name,
                    'start_km': round(start_km, 1),
                    'end_km': round(end_km, 1),
                    'elev_gain': round(elev_gain, 0)
                })

        return climbs

    def analyze_vam_comparison(
        self,
        segments: Optional[List[dict]] = None
    ) -> List[ClimbVAM]:
        """
        Compare la VAM (Vitesse Ascensionnelle Moyenne) sur différentes montées.

        Args:
            segments: Liste optionnelle de segments manuels.
                      Si None, détecte automatiquement.

        Returns:
            Liste des statistiques VAM par montée
        """
        df = self.df.copy()

        # Détecte les montées si non fournies
        if segments is None:
            segments = self._detect_climbs()

        if not segments:
            return []

        results = []

        for seg in segments:
            start_m = seg['start_km'] * 1000
            end_m = seg['end_km'] * 1000

            # Trouve les indices correspondants
            mask = (df['distance'] >= start_m) & (df['distance'] <= end_m)
            subset = df[mask].copy()

            if len(subset) < 10:
                continue

            # Lisse l'altitude et calcule le D+
            subset['alt_smooth'] = smooth_series(subset['altitude'], window=5)
            elev_gain = calculate_cumulative_gain(subset['alt_smooth'])

            # Calcule la durée
            duration_hours = (subset.index[-1] - subset.index[0]).total_seconds() / 3600

            if duration_hours > 0 and elev_gain > 0:
                vam = elev_gain / duration_hours
                avg_hr = subset['heart_rate'].mean() if 'heart_rate' in subset.columns else 0

                results.append(ClimbVAM(
                    climb_name=seg['name'],
                    vam=round(vam, 0),
                    avg_hr=round(avg_hr, 0),
                    elev_gain=round(seg.get('elev_gain', elev_gain), 0),
                    start_km=seg['start_km'],
                    end_km=seg['end_km']
                ))

        return results

    # =========================================================================
    # 4. ANALYSE D'EFFICACITÉ / DRIFT
    # =========================================================================

    def analyze_efficiency_drift(
        self,
        smoothing_window: int = 900
    ) -> EfficiencyResult:
        """
        Analyse l'évolution de l'efficacité (effort meters / heartbeat).

        Args:
            smoothing_window: Fenêtre de lissage en secondes

        Returns:
            Résultat avec tendance et timeseries
        """
        df = self.df.copy()

        # Calcule le D+ par point
        df['gain_pos'] = df['delta_alt'].clip(lower=0)

        # Vitesse réelle en m/min
        real_speed_m_min = df['speed'] * 60

        # Bonus effort: 1m D+ = 10m plat (équivalence standard)
        effort_bonus_m_min = df['gain_pos'] * 10 * 60
        df['effort_speed_m_min'] = real_speed_m_min + effort_bonus_m_min

        # Filtre les segments actifs
        mask = (df['heart_rate'] > 40) & (df['effort_speed_m_min'] > 50)
        df_active = df[mask].copy()

        if len(df_active) < 100:
            return EfficiencyResult(
                start_avg=0,
                end_avg=0,
                loss_pct=0,
                timeseries=[]
            )

        # Efficacité: mètres d'effort par battement
        df_active['efficiency'] = df_active['effort_speed_m_min'] / df_active['heart_rate']

        # Temps en minutes depuis le début
        df_active['time_min'] = (df_active.index - df_active.index[0]).total_seconds() / 60

        # Lisse l'efficacité
        df_active['ef_smooth'] = df_active['efficiency'].rolling(
            window=smoothing_window, center=True
        ).mean()

        # Compare première et dernière heure
        total_time = df_active['time_min'].max()
        mask_first = df_active['time_min'] <= 60
        mask_last = df_active['time_min'] >= (total_time - 60)

        avg_first = df_active.loc[mask_first, 'efficiency'].mean()
        avg_last = df_active.loc[mask_last, 'efficiency'].mean()

        loss_pct = ((avg_first - avg_last) / avg_first * 100) if avg_first > 0 else 0

        # Crée la timeseries (échantillonnée)
        sample_indices = np.linspace(0, len(df_active) - 1, min(200, len(df_active)), dtype=int)
        timeseries = []

        for idx in sample_indices:
            row = df_active.iloc[idx]
            if pd.notna(row['ef_smooth']):
                timeseries.append(EfficiencyPoint(
                    time_min=round(row['time_min'], 1),
                    efficiency=round(row['ef_smooth'], 3),
                    altitude=round(row['altitude'], 0)
                ))

        return EfficiencyResult(
            start_avg=round(avg_first, 3),
            end_avg=round(avg_last, 3),
            loss_pct=round(loss_pct, 1),
            timeseries=timeseries
        )

    # =========================================================================
    # 5. ANALYSE DE DÉCORRÉLATION (DECOUPLING)
    # =========================================================================

    def analyze_decoupling(
        self,
        window_minutes: int = 45,
        correlation_window: str = '5min'
    ) -> Optional[DecouplingResult]:
        """
        Analyse la décorrélation HR/Vitesse (heat stress, fatigue).

        Args:
            window_minutes: Fenêtre d'analyse avant le pic HR
            correlation_window: Fenêtre pour la corrélation rolling

        Returns:
            Résultat de décorrélation ou None si pas de données HR
        """
        df = self.df.copy()

        if 'heart_rate' not in df.columns or 'gap_speed' not in df.columns:
            return None

        # Trouve le pic de HR
        time_peak = df['heart_rate'].idxmax()
        max_hr = df['heart_rate'].max()

        # Fenêtre d'analyse
        start_window = time_peak - pd.Timedelta(minutes=window_minutes)
        df_window = df.loc[start_window:time_peak].copy()

        if len(df_window) < 50:
            return None

        # Calcule la corrélation rolling
        df_window['rolling_corr'] = df_window['gap_speed'].rolling(
            window=correlation_window
        ).corr(df_window['heart_rate'])

        # Échantillonne pour la timeseries
        sample_indices = np.linspace(0, len(df_window) - 1, min(100, len(df_window)), dtype=int)
        timeseries = []

        for idx in sample_indices:
            row = df_window.iloc[idx]
            if pd.notna(row['rolling_corr']):
                timeseries.append(DecouplingPoint(
                    time=row.name.isoformat(),
                    hr=round(row['heart_rate'], 0),
                    gap_speed=round(row['gap_speed'] * 3.6, 2),  # km/h
                    rolling_corr=round(row['rolling_corr'], 3)
                ))

        return DecouplingResult(
            peak_hr=round(max_hr, 0),
            peak_hr_time=time_peak.isoformat(),
            timeseries=timeseries
        )

    # =========================================================================
    # 6. PROFIL DE FORCE (GAP PAR GRADIENT)
    # =========================================================================

    def analyze_force_profile(
        self,
        min_speed_kmh: float = 3.0,
        slope_range: Tuple[int, int] = (-40, 40)
    ) -> List[ForceProfilePoint]:
        """
        Calcule le GAP pace médian par tranche de gradient.

        Args:
            min_speed_kmh: Vitesse minimum pour inclure un point
            slope_range: Plage de pentes à analyser

        Returns:
            Liste de (slope_bin, gap_pace) pour la heatmap
        """
        df = self.df.copy()

        # Calcule le GAP en km/h puis en min/km
        df['gap_kmh'] = df['gap_speed'] * 3.6

        # Filtre
        mask = df['gap_kmh'] > min_speed_kmh
        df_filtered = df[mask].copy()

        # Pace en min/km
        df_filtered['gap_pace'] = 60 / df_filtered['gap_kmh']

        # Bin par pente (arrondi à l'entier)
        df_filtered['slope_bin'] = df_filtered['slope_smooth'].round().astype(int)

        # Filtre la plage de pentes
        df_filtered = df_filtered[
            (df_filtered['slope_bin'] >= slope_range[0]) &
            (df_filtered['slope_bin'] <= slope_range[1])
        ]

        # Groupe et calcule la médiane
        grouped = df_filtered.groupby('slope_bin')['gap_pace'].median()

        results = []
        for slope_bin in range(slope_range[0], slope_range[1] + 1):
            if slope_bin in grouped.index:
                results.append(ForceProfilePoint(
                    slope_bin=slope_bin,
                    gap_pace_min_km=round(grouped[slope_bin], 2)
                ))
            else:
                # Interpole si manquant
                results.append(ForceProfilePoint(
                    slope_bin=slope_bin,
                    gap_pace_min_km=0  # Sera interpolé côté frontend
                ))

        return results

    # =========================================================================
    # ANALYSE COMPLÈTE
    # =========================================================================

    def run_full_analysis(self) -> TrailAnalysisResult:
        """
        Exécute toutes les analyses et retourne le résultat complet.

        Returns:
            TrailAnalysisResult avec toutes les données
        """
        df = self.df

        # Métadonnées
        distance_km = df['distance'].max() / 1000
        duration_seconds = (df.index[-1] - df.index[0]).total_seconds()
        elevation_gain = calculate_cumulative_gain(df['altitude'])

        return TrailAnalysisResult(
            activity_name=self.activity_name,
            distance_km=round(distance_km, 2),
            duration_seconds=round(duration_seconds, 0),
            elevation_gain=round(elevation_gain, 0),

            aid_stations=self.analyze_aid_stations(),
            run_walk_data=self.analyze_run_walk(),
            vam_comparison=self.analyze_vam_comparison(),
            efficiency=self.analyze_efficiency_drift(),
            decoupling=self.analyze_decoupling(),
            force_profile=self.analyze_force_profile()
        )


# =============================================================================
# FIT FILE PARSER
# =============================================================================

def parse_fit_file(file_path: str) -> pd.DataFrame:
    """
    Parse un fichier FIT et retourne un DataFrame prêt pour l'analyse.

    Args:
        file_path: Chemin vers le fichier FIT

    Returns:
        DataFrame avec les colonnes nécessaires
    """
    import fitparse

    fitfile = fitparse.FitFile(file_path)
    data_points = []

    for record in fitfile.get_messages('record'):
        record_data = {}
        for field in record:
            record_data[field.name] = field.value
        data_points.append(record_data)

    df = pd.DataFrame(data_points)

    # Conversion des coordonnées GPS
    if 'position_lat' in df.columns and 'position_long' in df.columns:
        conversion_factor = 180 / (2**31)
        df['latitude'] = df['position_lat'] * conversion_factor
        df['longitude'] = df['position_long'] * conversion_factor
        df.drop(['position_lat', 'position_long'], axis=1, inplace=True, errors='ignore')

    # Conversion timestamp
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])

    return df


def parse_gpx_file(file_path: str) -> pd.DataFrame:
    """
    Parse un fichier GPX et retourne un DataFrame prêt pour l'analyse.

    Args:
        file_path: Chemin vers le fichier GPX

    Returns:
        DataFrame avec les colonnes nécessaires
    """
    import gpxpy

    with open(file_path, 'r') as f:
        gpx = gpxpy.parse(f)

    data_points = []
    cumulative_distance = 0
    prev_point = None

    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                if prev_point:
                    # Calcule la distance depuis le point précédent
                    dist = point.distance_2d(prev_point)
                    if dist:
                        cumulative_distance += dist

                data = {
                    'timestamp': point.time,
                    'latitude': point.latitude,
                    'longitude': point.longitude,
                    'altitude': point.elevation or 0,
                    'distance': cumulative_distance,
                }

                # Extensions (HR, cadence, etc.)
                if point.extensions:
                    for ext in point.extensions:
                        if 'hr' in ext.tag.lower():
                            data['heart_rate'] = float(ext.text)
                        if 'cad' in ext.tag.lower():
                            data['cadence'] = float(ext.text)

                data_points.append(data)
                prev_point = point

    df = pd.DataFrame(data_points)

    # Calcule la vitesse
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.set_index('timestamp')

        time_diff = df.index.to_series().diff().dt.total_seconds()
        dist_diff = df['distance'].diff()
        df['speed'] = (dist_diff / time_diff).fillna(0).clip(lower=0)
        df = df.reset_index()

    return df


# =============================================================================
# FASTAPI ENDPOINTS (Example)
# =============================================================================

"""
Exemple d'intégration FastAPI:

from fastapi import FastAPI, UploadFile, File, HTTPException
from trail_analysis import TrailAnalyzer, parse_fit_file, parse_gpx_file
import tempfile
import os

app = FastAPI()

@app.post("/analysis/trail/{activity_id}")
async def analyze_activity(activity_id: int):
    # Récupère les données de l'activité depuis la base
    df = get_activity_streams_from_db(activity_id)  # À implémenter
    activity = get_activity_from_db(activity_id)  # À implémenter

    analyzer = TrailAnalyzer(df, activity_name=activity.name)
    result = analyzer.run_full_analysis()

    return result.to_dict()


@app.post("/analysis/trail/upload")
async def analyze_uploaded_file(file: UploadFile = File(...)):
    # Sauvegarde temporaire
    ext = file.filename.split('.')[-1].lower()

    if ext not in ['fit', 'gpx']:
        raise HTTPException(400, "Format non supporté. Utilisez .fit ou .gpx")

    with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{ext}') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if ext == 'fit':
            df = parse_fit_file(tmp_path)
        else:
            df = parse_gpx_file(tmp_path)

        analyzer = TrailAnalyzer(df, activity_name=file.filename)
        result = analyzer.run_full_analysis()

        return result.to_dict()

    finally:
        os.unlink(tmp_path)
"""

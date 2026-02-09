"""
Exemple d'utilisation du module Trail Analysis
==============================================

Ce script montre comment utiliser l'analyseur avec ton fichier FIT.
"""

from trail_analysis import (
    TrailAnalyzer,
    parse_fit_file,
    parse_gpx_file
)
import json


def main():
    # =================================================================
    # 1. CHARGER UN FICHIER FIT
    # =================================================================
    print("=" * 60)
    print("TRAIL ANALYSIS - Example Usage")
    print("=" * 60)

    # Remplace par ton chemin de fichier
    fit_file_path = "../fitfiletools.fit"

    print(f"\n[1/2] Parsing FIT file: {fit_file_path}")
    df = parse_fit_file(fit_file_path)

    print(f"      -> {len(df)} data points loaded")
    print(f"      -> Columns: {list(df.columns)}")

    # =================================================================
    # 2. LANCER L'ANALYSE
    # =================================================================
    print("\n[2/2] Running full trail analysis...")

    analyzer = TrailAnalyzer(df, activity_name="Trail Mi-Hard")
    result = analyzer.run_full_analysis()

    # =================================================================
    # 3. AFFICHER LES RÉSULTATS
    # =================================================================
    print("\n" + "=" * 60)
    print("ANALYSIS RESULTS")
    print("=" * 60)

    # Métadonnées
    print(f"\n📊 Activity: {result.activity_name}")
    print(f"   Distance: {result.distance_km} km")
    print(f"   Duration: {result.duration_seconds / 3600:.1f} hours")
    print(f"   Elevation Gain: {result.elevation_gain} m")

    # 1. Ravitaillements
    print(f"\n🏃 Aid Stations ({len(result.aid_stations)} detected):")
    for station in result.aid_stations:
        print(f"   - {station.name}: {station.duration_min} min")

    # 2. Run/Walk
    print(f"\n👟 Run/Walk Data: {len(result.run_walk_data)} points")

    # 3. VAM Comparison
    print(f"\n⛰️  Climb Analysis ({len(result.vam_comparison)} climbs):")
    for climb in result.vam_comparison:
        print(f"   - {climb.climb_name}")
        print(f"     VAM: {climb.vam} m/h | HR: {climb.avg_hr} bpm | D+: {climb.elev_gain}m")

    # 4. Efficiency
    print(f"\n💪 Efficiency Drift:")
    print(f"   Start avg: {result.efficiency.start_avg:.3f} effort-m/beat")
    print(f"   End avg: {result.efficiency.end_avg:.3f} effort-m/beat")
    print(f"   Loss: {result.efficiency.loss_pct}%")

    # 5. Decoupling
    if result.decoupling:
        print(f"\n🔥 Decoupling Analysis:")
        print(f"   Peak HR: {result.decoupling.peak_hr} bpm")
        print(f"   Peak time: {result.decoupling.peak_hr_time}")

    # 6. Force Profile
    print(f"\n📈 Force Profile: {len(result.force_profile)} gradient bins")

    # =================================================================
    # 4. EXPORT JSON
    # =================================================================
    output_path = "analysis_result.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)

    print(f"\n✅ Full results exported to: {output_path}")


def analyze_gpx_example():
    """Exemple avec un fichier GPX"""
    gpx_file_path = "your_activity.gpx"
    df = parse_gpx_file(gpx_file_path)
    analyzer = TrailAnalyzer(df, activity_name="My GPX Activity")
    return analyzer.run_full_analysis()


if __name__ == "__main__":
    main()

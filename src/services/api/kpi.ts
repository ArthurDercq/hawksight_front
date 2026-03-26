import { apiClient } from './client';
import type { KPIData, RecordsData, PersonalRecord, TrailRecord } from '@/types';

// API response wrapper types
interface KPIResponse {
  kpis: KPIData;
}

interface RecordsResponse {
  records: Record<string, unknown>;
}

// Mapping from API keys to display keys (distance records)
const RECORD_KEY_MAP: Record<string, string> = {
  '5k': '5 km',
  '10k': '10 km',
  'semi': 'Semi',
  '30k': '30 km',
  'marathon': 'Marathon',
  '50k': '50 km',
  '75k': '75 km',
  'longest': 'Plus longue',
};

// Trail record keys (non-distance)
const TRAIL_RECORD_KEYS = [
  'climb_5min', 'climb_30min', 'climb_60min',
  'descent_5min', 'descent_30min',
  'longest_climb',
  'kv_1000m',
  'max_dplus_activity', 'best_dplus_ratio', 'best_week_dplus',
];

export const kpiApi = {
  async getKPIs(year?: number): Promise<KPIData> {
    const params = year
      ? { start_date: `${year}-01-01`, end_date: `${year}-12-31` }
      : {};
    const response = await apiClient.fetchWithCache<KPIResponse>('/kpi/', { params }, 300000);
    return response.kpis;
  },

  async excludeRecord(recordId: string, excluded: boolean): Promise<void> {
    await apiClient.put(`/kpi/records/${recordId}/exclude`, null, { params: { excluded } });
    apiClient.clearCache(/\/kpi\/records/);
  },

  async getRecords(): Promise<RecordsData> {
    const response = await apiClient.fetchWithCache<RecordsResponse>('/kpi/records', undefined, 600000);
    const raw = response.records;

    // Helper — prend le premier element si la valeur est un tableau
    const first = (v: unknown): TrailRecord | null => {
      if (!v) return null;
      if (Array.isArray(v)) return (v[0] as TrailRecord) ?? null;
      return v as TrailRecord;
    };

    // Distance records — map nouveau format vers PersonalRecord
    const transformedRecords: Record<string, PersonalRecord | null> = {};
    for (const [apiKey, displayKey] of Object.entries(RECORD_KEY_MAP)) {
      const r = first(raw[apiKey]);
      if (!r) { transformedRecords[displayKey] = null; continue; }
      transformedRecords[displayKey] = {
        distance: displayKey,
        time: r.time_formatted ?? r.value_formatted ?? '--:--',
        date: r.date,
        activity_id: r.activity_id,
        activity_name: r.activity_name,
      };
    }

    // Trail records — stocker le tableau complet (top-3)
    const all = (v: unknown): TrailRecord[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v as TrailRecord[];
      return [v as TrailRecord];
    };

    const trailRecords: Record<string, TrailRecord[]> = {};
    for (const key of TRAIL_RECORD_KEYS) {
      trailRecords[key] = all(raw[key]);
    }

    return { records: transformedRecords, trailRecords };
  },
};

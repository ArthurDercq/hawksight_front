import { apiClient } from './client';
import type { KPIData, RecordsData, PersonalRecord } from '@/types';

// API response wrapper types
interface KPIResponse {
  kpis: KPIData;
}

interface RecordsResponse {
  records: Record<string, PersonalRecord | null>;
}

// Mapping from API keys to display keys
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

export const kpiApi = {
  async getKPIs(year?: number): Promise<KPIData> {
    // Use start_date and end_date for year filtering like vanilla JS
    const params = year
      ? { start_date: `${year}-01-01`, end_date: `${year}-12-31` }
      : {};
    const response = await apiClient.get<KPIResponse>('/kpi/', { params });
    return response.data.kpis;
  },

  async getRecords(): Promise<RecordsData> {
    const response = await apiClient.get<RecordsResponse>('/kpi/records');

    // Transform API keys to display keys
    const transformedRecords: Record<string, PersonalRecord | null> = {};
    for (const [apiKey, displayKey] of Object.entries(RECORD_KEY_MAP)) {
      transformedRecords[displayKey] = response.data.records[apiKey] || null;
    }

    return { records: transformedRecords };
  },
};

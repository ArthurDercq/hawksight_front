/**
 * Trail Analysis API Service
 * ==========================
 * Handles communication with the backend analysis endpoints.
 */

import { apiClient } from './client';
import type { TrailAnalysisResult } from '@/types/analysis';

export const analysisApi = {
  /**
   * Analyze an existing activity by ID
   */
  async analyzeActivity(activityId: number): Promise<TrailAnalysisResult> {
    const response = await apiClient.post<TrailAnalysisResult>(
      `/analysis/trail/${activityId}`
    );
    return response.data;
  },

  /**
   * Analyze an uploaded FIT or GPX file
   */
  async analyzeFile(file: File): Promise<TrailAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<TrailAnalysisResult>(
      '/analysis/trail/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';

interface CacheEntry {
  data: unknown;
  expiry: number;
}

class ApiClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('eyesight_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('eyesight_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private generateCacheKey(url: string, params?: Record<string, unknown>): string {
    return url + (params ? JSON.stringify(params) : '');
  }

  async fetchWithCache<T>(
    url: string,
    config?: AxiosRequestConfig,
    cacheTTL: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, config?.params as Record<string, unknown>);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }

    const response = await this.client.get<T>(url, config);
    this.cache.set(cacheKey, { data: response.data, expiry: Date.now() + cacheTTL });
    return response.data;
  }

  clearCache(pattern?: RegExp): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();

import axios from 'axios';
import { ENV } from '@/config/env';
import type { AuthToken } from '@/types';

export const authApi = {
  async getStravaLoginUrl(invite?: string): Promise<string> {
    const url = invite
      ? `${ENV.API_BASE_URL}/auth/strava/login?invite=${encodeURIComponent(invite)}`
      : `${ENV.API_BASE_URL}/auth/strava/login`;
    const response = await axios.get<{ authorization_url: string }>(url);
    return response.data.authorization_url;
  },

  async exchangeStravaCode(code: string): Promise<AuthToken> {
    const response = await axios.post<AuthToken>(
      `${ENV.API_BASE_URL}/auth/strava/exchange-code?code=${encodeURIComponent(code)}`
    );
    return response.data;
  },
};

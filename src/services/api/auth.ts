import axios from 'axios';
import { ENV } from '@/config/env';
import type { AuthToken } from '@/types';

export const authApi = {
  async login(username: string, password: string): Promise<AuthToken> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post<AuthToken>(
      `${ENV.API_BASE_URL}/login`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  },
};

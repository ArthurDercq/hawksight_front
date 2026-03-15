export type UserRole = 'admin' | 'user' | 'demo';

export interface CurrentUser {
  sub: string;
  role: UserRole;
  username?: string;
}

export interface UserProfile {
  id: number;
  strava_id?: number;
  username?: string;
  email_address?: string;
  created_at: string;
  last_sync_at?: string;
  is_active: boolean;
  role: UserRole;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

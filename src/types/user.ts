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
  last_activity_at?: string;
  is_active: boolean;
  role: UserRole;
  // Champs étendus — retournés par /auth/strava/profile
  firstname?: string;
  lastname?: string;
  profile_picture?: string;
  city?: string;
  country?: string;
  activities_count?: number;
  features_count?: number;
  max_hr?: number | null;
}

export interface StravaSyncStatus {
  user_id: number;
  strava_id: number;
  last_sync_at: string | null;
  last_activity_at: string | null;
  activities_count: number;
  features_count: number;
  is_syncing: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

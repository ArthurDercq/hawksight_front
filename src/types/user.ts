export interface UserProfile {
  strava_id: number;
  firstname: string;
  lastname: string;
  username: string;
  email_address?: string;
  profile_picture?: string;
  city?: string;
  country?: string;
  premium: boolean;
  activities_count: number;
  created_at: string;
  streams_count?: number;
  last_sync_at?: string;
  sex?: 'M' | 'F';
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// Dog types - using Supabase directly, Sequelize models are legacy

export enum DogGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum DogHealthStatus {
  HEALTHY = 'healthy',
  SICK = 'sick',
  INJURED = 'injured',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

interface DogAttributes {
  id: string;
  name?: string;
  color?: string;
  gender: DogGender;
  breed?: string;
  age_approx?: number;
  is_sterilized: boolean;
  health_status: DogHealthStatus;
  health_notes?: string;
  image_url?: string;
  qr_code_url?: string;
  qr_code_id?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  last_seen_at?: string;
  last_fed_at?: string;
  created_by: string;
  is_lost: boolean;
  is_found: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export type { DogAttributes };

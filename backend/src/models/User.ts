// User types - using Supabase directly, Sequelize models are legacy
// This file kept for enums and types used elsewhere in the codebase

export enum UserRole {
  ANIMAL_LOVER = 'animal_lover',
  REPORTER = 'reporter',
  FEEDER = 'feeder',
  ADOPTER = 'adopter',
  FOSTER = 'foster',
  TRANSPORTER = 'transporter',
  VOLUNTEER = 'volunteer',
  RESCUER = 'rescuer',
  CARETAKER = 'caretaker',
  STERILIZATION_COORDINATOR = 'sterilization_coordinator',
  INSPECTOR = 'inspector',
  VET = 'vet',
  PARAVET = 'paravet',
  NGO = 'ngo',
  TRAINER = 'trainer',
  GROOMER = 'groomer',
}

// User interface for Supabase
interface UserAttributes {
  id: string;
  phone: string;
  country_code: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  country: string | null;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  last_active_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type { UserAttributes };

/**
 * App-wide design tokens and constants.
 * Re-export theme and add flat colors + RADIUS_OPTIONS for screens.
 */

export { Colors, Fonts } from './theme';

export const colors = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  surface: '#F0F0F2',
  border: '#E5E5EA',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textLight: '#AEAEB2',
  textOnPrimary: '#FFFFFF',
  primary: '#0A7EA4',
  primaryLight: '#E6F4FE',
  secondary: '#5856D6',
  success: '#34C759',
  // Dog / status
  genderMale: '#007AFF',
  genderFemale: '#FF2D55',
  genderUnknown: '#8E8E93',
  statusHealthy: '#34C759',
  statusSick: '#FF9500',
  statusInjured: '#FF3B30',
  statusCritical: '#AF52DE',
  /** Error / validation messages */
  error: '#FF3B30',
} as const;

export const RADIUS_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
] as const;

export const ROLE_CATEGORIES = {
  CITIZEN: 'citizen',
  RESCUE: 'rescue',
  PROFESSIONAL: 'professional',
} as const;

export const USER_ROLES = {
  ANIMAL_LOVER: 'animal_lover',
  REPORTER: 'reporter',
  FEEDER: 'feeder',
  ADOPTER: 'adopter',
  FOSTER: 'foster',
  TRANSPORTER: 'transporter',
  VOLUNTEER: 'volunteer',
  RESCUER: 'rescuer',
  CARETAKER: 'caretaker',
  STERILIZATION_COORDINATOR: 'sterilization_coordinator',
  INSPECTOR: 'inspector',
  VET: 'vet',
  PARAVET: 'paravet',
  NGO: 'ngo',
  TRAINER: 'trainer',
  GROOMER: 'groomer',
} as const;

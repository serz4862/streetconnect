export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  pusher: {
    key: process.env.EXPO_PUBLIC_PUSHER_KEY || '',
    cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'ap2',
  },
  appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'streetconnect',
};

export const USER_ROLES = {
  // Citizen & Community
  ANIMAL_LOVER: 'animal_lover',
  REPORTER: 'reporter',
  FEEDER: 'feeder',
  ADOPTER: 'adopter',
  FOSTER: 'foster',
  TRANSPORTER: 'transporter',
  VOLUNTEER: 'volunteer',
  
  // Rescue & Welfare
  RESCUER: 'rescuer',
  CARETAKER: 'caretaker',
  STERILIZATION_COORDINATOR: 'sterilization_coordinator',
  INSPECTOR: 'inspector',
  
  // Professional / Organization
  VET: 'vet',
  PARAVET: 'paravet',
  NGO: 'ngo',
  TRAINER: 'trainer',
  GROOMER: 'groomer',
} as const;

export const ROLE_CATEGORIES = {
  CITIZEN: 'Citizen / Community',
  RESCUE: 'Rescue & Welfare',
  PROFESSIONAL: 'Professional / Org',
} as const;

export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.ANIMAL_LOVER]: 'Care for and support stray dogs in your community',
  [USER_ROLES.REPORTER]: 'Report dog sightings and issues',
  [USER_ROLES.FEEDER]: 'Regular feeding of stray dogs',
  [USER_ROLES.ADOPTER]: 'Looking to adopt a dog',
  [USER_ROLES.FOSTER]: 'Provide temporary home for dogs',
  [USER_ROLES.TRANSPORTER]: 'Help transport dogs for care',
  [USER_ROLES.VOLUNTEER]: 'General volunteering activities',
  [USER_ROLES.RESCUER]: 'Rescue dogs in distress',
  [USER_ROLES.CARETAKER]: 'Primary caretaker for specific dogs',
  [USER_ROLES.STERILIZATION_COORDINATOR]: 'Coordinate sterilization programs',
  [USER_ROLES.INSPECTOR]: 'Inspect and verify dog welfare',
  [USER_ROLES.VET]: 'Veterinary professional',
  [USER_ROLES.PARAVET]: 'Paraveterinary professional',
  [USER_ROLES.NGO]: 'Animal welfare organization',
  [USER_ROLES.TRAINER]: 'Dog trainer',
  [USER_ROLES.GROOMER]: 'Pet groomer',
};

export const DOG_GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
} as const;

export const DOG_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  SICK: 'sick',
  INJURED: 'injured',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown',
} as const;

export const REPORT_TYPES = {
  LOST: 'lost',
  FOUND: 'found',
  ISSUE: 'issue',
  ABUSE: 'abuse',
  HEALTH: 'health',
} as const;

export const RADIUS_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
];

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MESSAGES_LIMIT: 50,
};

export * from './colors';

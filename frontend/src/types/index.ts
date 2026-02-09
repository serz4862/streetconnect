export interface User {
  id: string;
  phone: string;
  country_code: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role: string;
  country?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  name?: string;
  color?: string;
  gender: 'male' | 'female' | 'unknown';
  breed?: string;
  age_approx?: number;
  is_sterilized: boolean;
  health_status: 'healthy' | 'sick' | 'injured' | 'critical' | 'unknown';
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
  created_at: string;
  updated_at: string;
  creator?: User;
  caretakers?: User[];
  my_caretaker_type?: string;
}

export interface FeedLog {
  id: string;
  dog_id: string;
  user_id: string;
  fed_at: string;
  notes?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  feeder?: User;
  dog?: Dog;
}

export interface Report {
  id: string;
  dog_id?: string;
  user_id: string;
  type: 'lost' | 'found' | 'issue' | 'abuse' | 'health';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  reporter?: User;
  dog?: Dog;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  user1?: User;
  user2?: User;
  other_user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

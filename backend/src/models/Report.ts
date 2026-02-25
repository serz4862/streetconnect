// Report types - using Supabase directly, Sequelize models are legacy

export enum ReportType {
  LOST = 'lost',
  FOUND = 'found',
  ISSUE = 'issue',
  ABUSE = 'abuse',
  HEALTH = 'health',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

interface ReportAttributes {
  id: string;
  dog_id?: string;
  user_id: string;
  type: ReportType;
  status: ReportStatus;
  title: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type { ReportAttributes };

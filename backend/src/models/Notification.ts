// Notification types - using Supabase directly, Sequelize models are legacy

export enum NotificationType {
  DOG_SCANNED = 'dog_scanned',
  DOG_NOT_FED = 'dog_not_fed',
  DOG_HEALTH_UPDATE = 'dog_health_update',
  NEW_MESSAGE = 'new_message',
  REPORT_UPDATE = 'report_update',
  NEW_CARETAKER = 'new_caretaker',
  SYSTEM = 'system',
}

interface NotificationAttributes {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type { NotificationAttributes };

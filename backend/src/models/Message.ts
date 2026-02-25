// Message types - using Supabase directly, Sequelize models are legacy

interface MessageAttributes {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type { MessageAttributes };

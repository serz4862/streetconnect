// Conversation types - using Supabase directly, Sequelize models are legacy

interface ConversationAttributes {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type { ConversationAttributes };

// FeedLog types - using Supabase directly, Sequelize models are legacy

interface FeedLogAttributes {
  id: string;
  dog_id: string;
  user_id: string;
  fed_at: string;
  notes?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export type { FeedLogAttributes };

// DogCaretaker types - using Supabase directly, Sequelize models are legacy

export enum CaretakerType {
  FEEDER = 'feeder',
  RESCUER = 'rescuer',
  BOTH = 'both',
}

interface DogCaretakerAttributes {
  id: string;
  dog_id: string;
  user_id: string;
  caretaker_type: CaretakerType;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export type { DogCaretakerAttributes };

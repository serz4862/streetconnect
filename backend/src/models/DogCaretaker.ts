import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

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
  created_at?: Date;
  updated_at?: Date;
}

interface DogCaretakerCreationAttributes extends Optional<DogCaretakerAttributes, 'id' | 'is_primary'> {}

class DogCaretaker extends Model<DogCaretakerAttributes, DogCaretakerCreationAttributes> implements DogCaretakerAttributes {
  public id!: string;
  public dog_id!: string;
  public user_id!: string;
  public caretaker_type!: CaretakerType;
  public is_primary!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DogCaretaker.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dog_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'dogs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    caretaker_type: {
      type: DataTypes.ENUM(...Object.values(CaretakerType)),
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'dog_caretakers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['dog_id'] },
      { fields: ['user_id'] },
      { fields: ['dog_id', 'user_id'], unique: true },
      { fields: ['caretaker_type'] },
    ],
  }
);

export default DogCaretaker;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FeedLogAttributes {
  id: string;
  dog_id: string;
  user_id: string;
  fed_at: Date;
  notes?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface FeedLogCreationAttributes extends Optional<FeedLogAttributes, 'id'> {}

class FeedLog extends Model<FeedLogAttributes, FeedLogCreationAttributes> implements FeedLogAttributes {
  public id!: string;
  public dog_id!: string;
  public user_id!: string;
  public fed_at!: Date;
  public notes?: string;
  public image_url?: string;
  public latitude?: number;
  public longitude?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FeedLog.init(
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
    fed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'feed_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['dog_id'] },
      { fields: ['user_id'] },
      { fields: ['fed_at'] },
      { fields: ['dog_id', 'fed_at'] },
    ],
  }
);

export default FeedLog;

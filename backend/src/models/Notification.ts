import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

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
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'is_read'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public user_id!: string;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public data?: Record<string, any>;
  public is_read!: boolean;
  public read_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
      { fields: ['user_id', 'is_read'] },
    ],
  }
);

export default Notification;

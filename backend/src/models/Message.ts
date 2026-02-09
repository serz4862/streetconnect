import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageAttributes {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  read_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'is_read'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public conversation_id!: string;
  public sender_id!: string;
  public receiver_id!: string;
  public content!: string;
  public image_url?: string;
  public is_read!: boolean;
  public read_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    image_url: {
      type: DataTypes.TEXT,
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
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['conversation_id'] },
      { fields: ['sender_id'] },
      { fields: ['receiver_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Message;

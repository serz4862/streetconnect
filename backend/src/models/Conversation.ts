import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ConversationAttributes {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public user1_id!: string;
  public user2_id!: string;
  public last_message?: string;
  public last_message_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    last_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user1_id'] },
      { fields: ['user2_id'] },
      { fields: ['user1_id', 'user2_id'], unique: true },
      { fields: ['last_message_at'] },
    ],
  }
);

export default Conversation;

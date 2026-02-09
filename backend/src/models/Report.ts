import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ReportType {
  LOST = 'lost',
  FOUND = 'found',
  ISSUE = 'issue',
  ABUSE = 'abuse',
  HEALTH = 'health',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

interface ReportAttributes {
  id: string;
  dog_id?: string;
  user_id: string;
  type: ReportType;
  status: ReportStatus;
  title: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  resolved_by?: string;
  resolved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: string;
  public dog_id?: string;
  public user_id!: string;
  public type!: ReportType;
  public status!: ReportStatus;
  public title!: string;
  public description?: string;
  public image_url?: string;
  public latitude!: number;
  public longitude!: number;
  public location_name?: string;
  public resolved_by?: string;
  public resolved_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dog_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'dogs',
        key: 'id',
      },
      onDelete: 'SET NULL',
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
      type: DataTypes.ENUM(...Object.values(ReportType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      allowNull: false,
      defaultValue: ReportStatus.PENDING,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    location_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resolved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['dog_id'] },
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Report;

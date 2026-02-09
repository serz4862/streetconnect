import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum DogGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum DogHealthStatus {
  HEALTHY = 'healthy',
  SICK = 'sick',
  INJURED = 'injured',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

interface DogAttributes {
  id: string;
  name?: string;
  color?: string;
  gender: DogGender;
  breed?: string;
  age_approx?: number;
  is_sterilized: boolean;
  health_status: DogHealthStatus;
  health_notes?: string;
  image_url?: string;
  qr_code_url?: string;
  qr_code_id?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  last_seen_at?: Date;
  last_fed_at?: Date;
  created_by: string;
  is_lost: boolean;
  is_found: boolean;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DogCreationAttributes extends Optional<DogAttributes, 'id' | 'is_sterilized' | 'health_status' | 'is_lost' | 'is_found'> {}

class Dog extends Model<DogAttributes, DogCreationAttributes> implements DogAttributes {
  public id!: string;
  public name?: string;
  public color?: string;
  public gender!: DogGender;
  public breed?: string;
  public age_approx?: number;
  public is_sterilized!: boolean;
  public health_status!: DogHealthStatus;
  public health_notes?: string;
  public image_url?: string;
  public qr_code_url?: string;
  public qr_code_id?: string;
  public latitude!: number;
  public longitude!: number;
  public location_name?: string;
  public last_seen_at?: Date;
  public last_fed_at?: Date;
  public created_by!: string;
  public is_lost!: boolean;
  public is_found!: boolean;
  public description?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Dog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(DogGender)),
      allowNull: false,
      defaultValue: DogGender.UNKNOWN,
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    age_approx: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 30,
      },
    },
    is_sterilized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    health_status: {
      type: DataTypes.ENUM(...Object.values(DogHealthStatus)),
      allowNull: false,
      defaultValue: DogHealthStatus.UNKNOWN,
    },
    health_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qr_code_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qr_code_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
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
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_fed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    is_lost: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_found: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'dogs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['created_by'] },
      { fields: ['qr_code_id'] },
      { fields: ['gender'] },
      { fields: ['is_sterilized'] },
      { fields: ['health_status'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['is_lost'] },
      { fields: ['is_found'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Dog;

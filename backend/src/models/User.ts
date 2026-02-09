import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum UserRole {
  ANIMAL_LOVER = 'animal_lover',
  REPORTER = 'reporter',
  FEEDER = 'feeder',
  ADOPTER = 'adopter',
  FOSTER = 'foster',
  TRANSPORTER = 'transporter',
  VOLUNTEER = 'volunteer',
  RESCUER = 'rescuer',
  CARETAKER = 'caretaker',
  STERILIZATION_COORDINATOR = 'sterilization_coordinator',
  INSPECTOR = 'inspector',
  VET = 'vet',
  PARAVET = 'paravet',
  NGO = 'ngo',
  TRAINER = 'trainer',
  GROOMER = 'groomer',
}

interface UserAttributes {
  id: string;
  phone: string;
  country_code: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  country?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  firebase_uid?: string;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  last_active_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'is_verified' | 'onboarding_completed'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public phone!: string;
  public country_code!: string;
  public name!: string;
  public email?: string;
  public avatar_url?: string;
  public role!: UserRole;
  public country?: string;
  public city?: string;
  public pincode?: string;
  public latitude?: number;
  public longitude?: number;
  public location_name?: string;
  public firebase_uid?: string;
  public is_active!: boolean;
  public is_verified!: boolean;
  public onboarding_completed!: boolean;
  public last_active_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    country_code: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '+91',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
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
    location_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    firebase_uid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    onboarding_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['phone'] },
      { fields: ['email'] },
      { fields: ['firebase_uid'] },
      { fields: ['role'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['is_active'] },
    ],
  }
);

export default User;

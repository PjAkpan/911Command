 
import { MysqlSequelizeInstance } from "../config"; 
import { DataTypes } from "sequelize";
 
const UserSchema = MysqlSequelizeInstance.define(
  "tblusers",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    consents: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "disabled"),
      defaultValue: "pending",
    },
    isProfileComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isPasswordChanged: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    isViaSocial: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    emailVerified: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: false,
    },
    phoneVerified: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: false,
    },

    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: false,
    },

    role: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    referralCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referralUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tblusers",
    timestamps: true,
    freezeTableName: true,
  },
);

//UserSchema.sync({ alter: true });
export const UsersModel = UserSchema;



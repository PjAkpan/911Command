 
import { MysqlSequelizeInstance } from "../config"; 
import { DataTypes } from "sequelize";
 
const otpSchema = MysqlSequelizeInstance.define(
  "tblotp",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    otp: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    accessToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    userCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    channel: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    channelType: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "disabled"),
      defaultValue: "pending",
    }, 
  },
  {
    tableName: "tblotp",
    timestamps: true,
    freezeTableName: true,
  },
);

///otpSchema.sync({ alter: true });
export const OtpModel = otpSchema;



import { Helpers } from "../types";
import { Document } from "mongoose";

export type FindInfoParams = {
  orderBy?: string;
  sort?: "ASC" | "DESC";
  size?: number;
  page?: number;
  gSearch?: string;
  filter?: Record<string, any>;
  status?: string;
  option?: string;
  startDate?: string;
  endDate?: string;
};

export type usersSchemaType = Document &
  Helpers.Timestamps & {
    id?: any;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    consents: boolean;
    role: string;
    isVerified?: boolean;
    status?: string;
  };

export type otpSchemaType = Document &
  Helpers.Timestamps & {
    _id?: string;
    userId: string;
    otp: string;
    accessToken: string;
    userCode: string;
    publicId?: string;
    channel: string;
    type: string;
    channelType: string;
  };
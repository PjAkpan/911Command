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
    _id?: string;
    name: string;
    sign: string;
    currency: string;
    image: string;
    status: string;
    isActive: boolean;
  };

 
 
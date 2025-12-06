import { Schema, model } from "mongoose"; 
import { usersSchemaType } from "./types"; 


const UsersSchema = new Schema(
  {
    publicId: {
      type: String,
      unique: true,
      sparse: true,
    },
    companyId: {
      type: String,
    },
    name: {
      type: String,
    },
    picture: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    bio: {
      type: String,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    isPasswordChanged: {
      type: Boolean,
      default: true,
    },
    isViaSocial: {
      type: Boolean,
    },
    emailVerified: {
      type: Date,
    },
    phoneVerified: {
      type: Date,
    },
    availableForWork: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    accounts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Account",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    // tokens: {
    //   type: Schema.Types.ObjectId,
    //   ref: "verificationToken",
    // },

    role: {
      type: String,
    },
    Review: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    feedback_actions: [
      {
        type: Schema.Types.ObjectId,
        ref: "FeedbackAction",
      },
    ],
    userWallets: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserWallet",
      },
    ],
    payments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],

    wallet_funds: [
      {
        type: Schema.Types.ObjectId,
        ref: "WalletFund",
      },
    ],
    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
);

export const UsersModel = model<usersSchemaType>("Users", UsersSchema);



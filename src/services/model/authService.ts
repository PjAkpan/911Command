import { usersSchemaType } from "../../models/types";
import { usersModel } from "../../models";
import bcrypt from "bcryptjs"; 
import { HttpStatusCode } from "../../config";
import { createHttpError, errorHandler } from "../../utils";

 const { UsersModel } = usersModel;

export const registerUser = async (userData: usersSchemaType) => {
  const { email, phone, password } = userData; 
   let rolesArray = null;
  try {
      rolesArray = JSON.stringify(["CUSTOMER"]);
      // Normalize phone and email
      const normalizedPhone = phone.startsWith("+") ? phone : `+234${phone}`;
      const normalizedEmail = email.toLowerCase();

      const existingUser = await UsersModel.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) { 
         throw createHttpError("Email already registered", 422);
      }

      const existingPhone = await UsersModel.findOne({
        where: { phone: normalizedPhone },
      });

      if (existingPhone) {
        
         throw createHttpError("Phone number already registered", 422);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      userData.email = normalizedEmail;
      userData.phone = normalizedPhone;
      userData.role = rolesArray;
      const newUser = await UsersModel.create({
        ...userData,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = newUser.toJSON();
      return {
        status: true,
        statusCode: HttpStatusCode.Created,
        message: "Users created successfully",
        payload: userWithoutPassword,
      };
    } catch (err) {
      console.error("Error creating Users:", err);
      return {
        status: false,
        statusCode: HttpStatusCode.InternalServerError,
        message: errorHandler(err, null).message || "Error creating Users",
        payload: null,
      };
    }
};

import { usersSchemaType } from "../../models/types";
import { usersModel } from "../../models";

import { HttpStatusCode } from "../../config";
import { errorHandler } from "../../utils";

const { UsersModel } = usersModel;

export const registerUser = async (userData: usersSchemaType) => {
  try {
    const newUser = await UsersModel.create({
      ...userData,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser.toJSON();
    
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
/**
 * Find one user with selected fields removed
 */
export const findOneUsers = async (filter: Record<string, any>) => {
  try {
    const found = await UsersModel.findOne({
      where: filter,
      attributes: { exclude: ["password"] }, // match EXCLUDED_FIELDS
    });

    return found
      ? {
        status: true,
        statusCode: HttpStatusCode.OK,
        message: "Users found",
        payload: found,
      }
      : {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "Users not found",
        payload: null,
      };
  } catch (err) {
    console.error("Error finding Users:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error finding Users",
      payload: null,
    };
  }
};

/**
 * Find one user (no excluded fields)
 */
export const findOneUser = async (filter: Record<string, any>) => {
  try {
    const found = await UsersModel.findOne({
      where: filter,
    });

    return found
      ? {
        status: true,
        statusCode: HttpStatusCode.OK,
        message: "Users found",
        payload: found,
      }
      : {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "Users not found",
        payload: null,
      };
  } catch (err) {
    console.error("Error finding Users:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error finding Users",
      payload: null,
    };
  }
};

/**
 * Get paginated and filtered users
 */
export const findAll = async (options: {
  filter?: Record<string, any>;
  page?: number;
  limit?: number;
  sort?: string | Record<string, 1 | -1>;
}) => {
  try {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = { createdAt: "DESC" }, // Sequelize uses ASC/DESC
    } = options;

    const offset = (page - 1) * limit;

    const { rows, count } = await UsersModel.findAndCountAll({
      where: filter,
      attributes: {
        exclude: [
          "password", 
        ],
      },
      order: [Object.entries(sort)[0]], // convert sort object
      offset,
      limit,
    });

    if (rows.length === 0) {
      return {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "No Users found",
        payload: null,
      };
    }

    return {
      status: true,
      statusCode: HttpStatusCode.OK,
      message: "Users retrieved successfully",
      payload: {
        allRecords: rows,
        recordCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit,
      },
    };
  } catch (err) {
    console.error("Error retrieving Users:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error retrieving Users",
      payload: null,
    };
  }
};

/**
 * Delete user by ID
 */
export const deleteUsersById = async (id: string) => {
  try {
    const deleted = await UsersModel.destroy({ where: { id } });

    if (!deleted) {
      return {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "Users not found",
        payload: null,
      };
    }

    return {
      status: true,
      statusCode: HttpStatusCode.OK,
      message: "Users deleted successfully",
      payload: null,
    };
  } catch (err) {
    console.error("Error deleting Users:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error deleting Users",
      payload: null,
    };
  }
};

/**
 * Update user using a filter
 */
export const updateUsersByFilter = async (
  filter: Record<string, any>,
  update: Record<string, any>,
) => {
  try {
    const user = await UsersModel.findOne({ where: filter });

    if (!user) {
      return {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "User not found to update",
        payload: null,
      };
    }

    const savedUser = await user.update(update);

    return {
      status: true,
      statusCode: HttpStatusCode.OK,
      message: "User updated successfully",
      payload: savedUser,
    };
  } catch (err) {
    console.error("Error updating user:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error updating user",
      payload: null,
    };
  }
};

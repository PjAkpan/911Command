// import { connect, connection } from "mongoose";


import { Sequelize,   } from "sequelize";
import { logger } from "netwrap";
import { getters } from "./getters";

// server connection settings

// const postGressConnectionString = getters.getDatabaseUrl().HOST;
// const idle =10000;// parseInt(getters.getDatabaseUrl().IDLE); // default 10s if not defined
// const dialectType = getters.getDatabaseUrl().DIALECT as Dialect; // default 'postgres' if not defined

export const MysqlSequelizeInstance = new Sequelize(
  getters.getDatabaseUrl().DB,
  getters.getDatabaseUrl().USER,
  getters.getDatabaseUrl().PASSWORD,
  {
    host: getters.getDatabaseUrl().HOST,
    port: getters.getDatabaseUrl().PORT,
    dialect: "mysql", // Specify the dialect directly as 'mysql'
    dialectOptions: {
      connectTimeout: 60000, // Increase connection timeout if needed
    },
    pool: {
      max: parseInt(getters.getDatabaseUrl().MAX),
    min: parseInt(getters.getDatabaseUrl().MIN),
    acquire: parseInt(getters.getDatabaseUrl().ACQUIRE),
  idle:10000,
// parsed as number
    },
    define: {
      timestamps: true,
      freezeTableName: true,
    },
     
    logging: console.log, // You can keep this for logging if needed
  },
);

// export const PostgresSequelizeInstance = new Sequelize(postGressConnectionString, {
//   dialect: dialectType,
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//     connectTimeout: parseInt(getters.getDatabaseUrl().ACQUIRE),
//   },
//   pool: {
//     max: parseInt(getters.getDatabaseUrl().MAX),
//     min: parseInt(getters.getDatabaseUrl().MIN),
//     acquire: parseInt(getters.getDatabaseUrl().ACQUIRE),
//     idle, // parsed as number
//   },
//   define: {
//     timestamps: true,
//     freezeTableName: true,
//   },
//   logging: console.log,
// });

const connectDB = async (
  sequelizeInstance: Sequelize,
  dbType: string,
  retries = 15000
) => {
  logger(`Connecting to ${dbType} database....`, {
    shouldLog: true,
    isError: false,
  });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelizeInstance.authenticate();
      logger(
        `${dbType} Database connection successful....`,
        {
          shouldLog: true,
          isError: false,
        },
      );
      return;
    } catch (err) {
      logger(
        `Attempt ${attempt} -
         Unable to connect to ${dbType} database`,
        {
          shouldLog: true,
          isError: true,
        }
      );
      logger((err as Error).message || String(err));

      // If last attempt, throw error
      if (attempt === retries) {
        throw new Error(
          `Failed to connect to ${dbType} 
          database after ${retries} attempts`
        );
      }

      // Wait before retrying
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};

 
// const postgresLoader = async () =>
//   await connectDB(PostgresSequelizeInstance, "PostgreSQL DB");

export const mysqlLoader = async () =>
  await connectDB(MysqlSequelizeInstance, "MYSQL_DB");

export const DBconnect = {mysqlLoader, MysqlSequelizeInstance };
 
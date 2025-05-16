const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

module.exports ={
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  STORE_ID: process.env.STORE_ID,
  STORE_PASSWORD: process.env.STORE_PASSWORD,
};

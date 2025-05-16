const app = require("./app");
const mongoose = require("mongoose");
const config = require("./config");

const port = config.PORT;

const server = async () => {
  try {
    await mongoose.connect(config.DB_URL);
    console.log("database connected");
    app.listen(port, () => {
      console.log(`server is running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

server();

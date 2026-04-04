const mongoose = require("mongoose");

const { env } = require("./config/env");

async function connectToDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production",
  });
}

module.exports = { connectToDatabase };


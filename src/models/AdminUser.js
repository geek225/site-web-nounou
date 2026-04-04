const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

module.exports = { AdminUser };


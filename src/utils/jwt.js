const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

function signAdminToken(adminUser) {
  return jwt.sign(
    {
      sub: String(adminUser._id),
      email: adminUser.email,
      typ: "admin",
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

module.exports = { signAdminToken };


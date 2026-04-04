const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

module.exports = { requireAdminAuth };


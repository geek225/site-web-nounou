const path = require("node:path");

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");

const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { authRouter } = require("./routes/authRouter");
const { publicRouter } = require("./routes/publicRouter");
const { adminRouter } = require("./routes/adminRouter");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((s) => s.trim()) : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);

const publicDir = path.join(process.cwd(), "public");
const adminDir = path.join(process.cwd(), "admin");

app.use(express.static(publicDir, { extensions: ["html"] }));
app.use("/admin", express.static(adminDir, { extensions: ["html"] }));

app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(adminDir, "index.html"));
});

app.use(errorHandler);

module.exports = { app, default: app };

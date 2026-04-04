function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = typeof err?.message === "string" ? err.message : "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
    },
  });
}

module.exports = { errorHandler };


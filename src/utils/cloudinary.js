const cloudinary = require("cloudinary").v2;

const { env } = require("../config/env");

function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

configureCloudinary();

module.exports = { cloudinary, isCloudinaryConfigured };


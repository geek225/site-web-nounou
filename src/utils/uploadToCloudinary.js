const { Readable } = require("node:stream");

const { cloudinary, isCloudinaryConfigured } = require("./cloudinary");

function uploadBufferToCloudinary(buffer, options) {
  if (!isCloudinaryConfigured()) {
    const err = new Error("Cloudinary not configured");
    err.status = 400;
    throw err;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    Readable.from(buffer).pipe(uploadStream);
  });
}

module.exports = { uploadBufferToCloudinary };


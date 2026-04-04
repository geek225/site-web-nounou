const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    media: { url: String, publicId: String },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Destination = mongoose.model("Destination", destinationSchema);

module.exports = { Destination };


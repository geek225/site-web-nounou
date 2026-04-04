const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    quote: { type: String, required: true, trim: true },
    avatar: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

module.exports = { Testimonial };


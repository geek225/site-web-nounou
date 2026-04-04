const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    design: {
      accentColor: { type: String, default: "#FF3B3B" },
      backgroundColor: { type: String, default: "#FFFFFF" },
      surfaceColor: { type: String, default: "#F5F5F5" },
      textColor: { type: String, default: "#222222" },
      fontFamily: { type: String, default: "Poppins" },
    },
    hero: {
      title: {
        type: String,
        default: "Discover Destinations Tailored to Your Perfect Journey",
      },
      subtitle: {
        type: String,
        default:
          "Let's embark on a global journey, immersing ourselves in diverse cultures and creating unforgettable memories as we travel the world!",
      },
      primaryCtaText: { type: String, default: "Explore More" },
      secondaryCtaText: { type: String, default: "Regardez la vidéo" },
      videoUrl: { type: String, default: "https://www.youtube.com/" },
      sliderImages: { type: [{ url: String, publicId: String }], default: [] },
      stats: {
        type: [
          {
            value: String,
            label: String,
          },
        ],
        default: [
          { value: "64+", label: "Countries" },
          { value: "24M+", label: "Users" },
          { value: "03k+", label: "Experiences" },
        ],
      },
    },
    about: {
      title: { type: String, default: "À propos" },
      text: {
        type: String,
        default:
          "Nous créons des voyages premium sur-mesure : expériences uniques, logistique parfaite et attention aux détails.",
      },
      image: { url: String, publicId: String },
    },
    cta: {
      title: { type: String, default: "Ready to start your journey?" },
      text: { type: String, default: "Tell us what you love — we’ll tailor the perfect trip." },
      buttonText: { type: String, default: "Formulaire" },
    },
    contact: {
      email: { type: String, default: "contact@example.com" },
      phone: { type: String, default: "+33 6 00 00 00 00" },
      address: { type: String, default: "Paris, France" },
    },
    brand: {
      name: { type: String, default: "Logo" },
      logo: { url: String, publicId: String },
    },
    layout: {
      sectionOrder: {
        type: [String],
        default: ["hero", "about", "services", "destinations", "cta", "testimonials", "contact"],
      },
      sectionEnabled: {
        type: Map,
        of: Boolean,
        default: {
          hero: true,
          about: true,
          services: true,
          destinations: true,
          cta: true,
          testimonials: true,
          contact: true,
        },
      },
    },
  },
  { timestamps: true },
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

module.exports = { SiteSettings };


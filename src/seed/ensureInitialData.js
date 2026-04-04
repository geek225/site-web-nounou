const { env } = require("../config/env");
const { getSupabaseAdmin, isSupabaseConfigured } = require("../supabase/client");
const { ensureLocalData } = require("../local/store");
const { hashPassword } = require("../utils/password");

async function ensureAdminUser() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  const existing = await supabase.from("admin_users").select("id").eq("email", email).maybeSingle();
  if (!existing.error && existing.data) return;

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  const inserted = await supabase.from("admin_users").insert({ email, password_hash: passwordHash });
  if (inserted.error) throw inserted.error;
}

async function ensureSiteSettings() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  const existing = await supabase.from("site_settings").select("id").eq("id", 1).maybeSingle();
  if (!existing.error && existing.data) {
    const currentRes = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (currentRes.error) return;
    const current = currentRes.data?.data || {};
    const currentServices = current?.servicesSection || {};
    const titleOk = typeof currentServices?.title === "string" && currentServices.title.trim();
    const subtitleOk = typeof currentServices?.subtitle === "string" && currentServices.subtitle.trim();
    if (titleOk && subtitleOk) return;

    const next = {
      ...current,
      servicesSection: {
        title: titleOk ? currentServices.title : "Nos services",
        subtitle: subtitleOk ? currentServices.subtitle : "Tout ce qu’il faut pour un voyage parfait, sans friction.",
      },
    };

    const upserted = await supabase.from("site_settings").upsert({ id: 1, data: next }, { onConflict: "id" });
    if (upserted.error) throw upserted.error;
    return;
  }

  const settings = {
    design: {
      accentColor: "#FF3B3B",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F5F5F5",
      textColor: "#222222",
      fontFamily: "Poppins",
    },
    hero: {
      title: "Discover Destinations Tailored to Your Perfect Journey",
      subtitle:
        "Let's embark on a global journey, immersing ourselves in diverse cultures and creating unforgettable memories as we travel the world!",
      primaryCtaText: "Explore More",
      primaryCtaHref: "#destinations",
      secondaryCtaText: "Regardez la vidéo",
      videoUrl: "https://www.youtube.com/",
      sliderImages: [
        { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80" },
      ],
      roundSliderImages: [
        { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80" },
        { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80" },
      ],
      stats: [
        { value: "64+", label: "Countries" },
        { value: "24M+", label: "Users" },
        { value: "03k+", label: "Experiences" },
      ],
    },
    about: {
      title: "À propos",
      text: "Nous créons des voyages premium sur-mesure : expériences uniques, logistique parfaite et attention aux détails.",
      image: { url: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80" },
    },
    cta: {
      title: "Ready to start your journey?",
      text: "Tell us what you love — we’ll tailor the perfect trip.",
      buttonText: "Formulaire",
    },
    contact: { email: "contact@example.com", phone: "+33 6 00 00 00 00", address: "Paris, France" },
    brand: { name: "Logo", logo: null },
    headerCta: { text: "Formulaire", href: "/formulaire.html" },
    navigation: {
      items: [
        { label: "Accueil", target: "#accueil" },
        { label: "À propos", target: "#apropos" },
        { label: "Nos services", target: "#services" },
        { label: "Contact", target: "#contact" },
      ],
    },
    servicesSection: {
      title: "Nos services",
      subtitle: "Tout ce qu’il faut pour un voyage parfait, sans friction.",
    },
    gallery: {
      title: "Destinations",
      subtitle: "Une sélection premium avec un style minimal et moderne.",
    },
    newsletter: {
      title: "Newsletter",
      text: "Recevez nos meilleures destinations et offres premium.",
      placeholder: "Votre email",
      buttonText: "S’inscrire",
    },
    social: {
      links: [
        { icon: "IG", label: "Instagram", url: "#" },
        { icon: "X", label: "X", url: "#" },
        { icon: "IN", label: "LinkedIn", url: "#" },
      ],
    },
    layout: {
      sectionOrder: ["hero", "about", "services", "destinations", "newsletter", "testimonials", "contact"],
      sectionEnabled: {
        hero: true,
        about: true,
        services: true,
        destinations: true,
        newsletter: true,
        testimonials: true,
        contact: true,
      },
    },
  };

  const upserted = await supabase.from("site_settings").upsert({ id: 1, data: settings }, { onConflict: "id" });
  if (upserted.error) throw upserted.error;
}

async function ensureCollections() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();

  const serviceCountRes = await supabase.from("services").select("id", { count: "exact", head: true });
  if (serviceCountRes.error) throw serviceCountRes.error;
  if ((serviceCountRes.count || 0) === 0) {
    const inserted = await supabase.from("services").insert([
      {
        title: "Premium Planning",
        description: "Itinéraires sur-mesure, réservation et logistique premium.",
        order_index: 1,
        enabled: true,
      },
      {
        title: "Local Experiences",
        description: "Accès à des expériences authentiques et exclusives.",
        order_index: 2,
        enabled: true,
      },
      {
        title: "24/7 Support",
        description: "Assistance avant, pendant et après votre voyage.",
        order_index: 3,
        enabled: true,
      },
    ]);
    if (inserted.error) throw inserted.error;
  }

  const destinationCountRes = await supabase.from("destinations").select("id", { count: "exact", head: true });
  if (destinationCountRes.error) throw destinationCountRes.error;
  if ((destinationCountRes.count || 0) === 0) {
    const inserted = await supabase.from("destinations").insert([
      {
        title: "Santorini",
        location: "Greece",
        tags: ["Sea", "Luxury"],
        media: { url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80" },
        order_index: 1,
        enabled: true,
      },
      {
        title: "Kyoto",
        location: "Japan",
        tags: ["Culture", "City"],
        media: { url: "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=80" },
        order_index: 2,
        enabled: true,
      },
      {
        title: "Dolomites",
        location: "Italy",
        tags: ["Mountain", "Adventure"],
        media: { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80" },
        order_index: 3,
        enabled: true,
      },
      {
        title: "Marrakech",
        location: "Morocco",
        tags: ["Culture", "Food"],
        media: { url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80" },
        order_index: 4,
        enabled: true,
      },
    ]);
    if (inserted.error) throw inserted.error;
  }

  const testimonialCountRes = await supabase.from("testimonials").select("id", { count: "exact", head: true });
  if (testimonialCountRes.error) throw testimonialCountRes.error;
  if ((testimonialCountRes.count || 0) === 0) {
    const inserted = await supabase.from("testimonials").insert([
      {
        name: "Sofia M.",
        role: "Traveler",
        quote: "Une expérience incroyable — chaque détail était parfaitement orchestré.",
        avatar: { url: "https://i.pravatar.cc/120?img=12" },
        order_index: 1,
        enabled: true,
      },
      {
        name: "Lucas R.",
        role: "Explorer",
        quote: "Des destinations superbes et un accompagnement premium du début à la fin.",
        avatar: { url: "https://i.pravatar.cc/120?img=5" },
        order_index: 2,
        enabled: true,
      },
      {
        name: "Amira K.",
        role: "Globetrotter",
        quote: "Le site est magnifique et le voyage était encore meilleur que prévu.",
        avatar: { url: "https://i.pravatar.cc/120?img=32" },
        order_index: 3,
        enabled: true,
      },
    ]);
    if (inserted.error) throw inserted.error;
  }
}

async function ensureInitialData() {
  if (!isSupabaseConfigured()) {
    await ensureLocalData();
  }
  await ensureAdminUser();
  await ensureSiteSettings();
  await ensureCollections();
}

module.exports = { ensureInitialData };

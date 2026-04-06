const defaultData = {
  settings: {
    design: {
      accentColor: "#FF3B3B",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F5F5F5",
      textColor: "#222222",
      fontFamily: "Poppins",
    },
    hero: {
      kickerText: "Premium Travel Studio",
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
      image: {
        url: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
      },
    },
    cta: {
      title: "Ready to start your journey?",
      text: "Tell us what you love — we’ll tailor the perfect trip.",
      buttonText: "Formulaire",
    },
    contact: {
      email: "contact@example.com",
      phone: "+33 6 00 00 00 00",
      address: "Paris, France",
    },
    brand: { name: "Super nounou", logo: null },
    headerCta: {
      text: "Formulaire",
      href: "/formulaire.html",
    },
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
      title: "Autres services",
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
  },
  services: [
    {
      id: "offline-service-1",
      title: "Premium Planning",
      description: "Itinéraires sur-mesure, réservation et logistique premium.",
      media: {
        url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
      },
      enabled: true,
      order_index: 1,
    },
    {
      id: "offline-service-2",
      title: "Local Experiences",
      description: "Accès à des expériences authentiques et exclusives.",
      media: {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      },
      enabled: true,
      order_index: 2,
    },
    {
      id: "offline-service-3",
      title: "24/7 Support",
      description: "Assistance avant, pendant et après votre voyage.",
      media: {
        url: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
      },
      enabled: true,
      order_index: 3,
    },
  ],
  serviceRequests: [],
  otherServices: [],
  destinations: [
    {
      id: "offline-destination-1",
      title: "Santorini",
      location: "Greece",
      tags: ["Sea", "Luxury"],
      media: { url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80" },
      enabled: true,
      order_index: 1,
    },
    {
      id: "offline-destination-2",
      title: "Kyoto",
      location: "Japan",
      tags: ["Culture", "City"],
      media: { url: "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=80" },
      enabled: true,
      order_index: 2,
    },
    {
      id: "offline-destination-3",
      title: "Dolomites",
      location: "Italy",
      tags: ["Mountain", "Adventure"],
      media: { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80" },
      enabled: true,
      order_index: 3,
    },
    {
      id: "offline-destination-4",
      title: "Marrakech",
      location: "Morocco",
      tags: ["Culture", "Food"],
      media: { url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80" },
      enabled: true,
      order_index: 4,
    },
  ],
  testimonials: [
    {
      id: "offline-testimonial-1",
      name: "Sofia M.",
      role: "Traveler",
      quote: "Une expérience incroyable — chaque détail était parfaitement orchestré.",
      avatar: { url: "https://i.pravatar.cc/120?img=12" },
      enabled: true,
      order_index: 1,
    },
    {
      id: "offline-testimonial-2",
      name: "Lucas R.",
      role: "Explorer",
      quote: "Des destinations superbes et un accompagnement premium du début à la fin.",
      avatar: { url: "https://i.pravatar.cc/120?img=5" },
      enabled: true,
      order_index: 2,
    },
    {
      id: "offline-testimonial-3",
      name: "Amira K.",
      role: "Globetrotter",
      quote: "Le site est magnifique et le voyage était encore meilleur que prévu.",
      avatar: { url: "https://i.pravatar.cc/120?img=32" },
      enabled: true,
      order_index: 3,
    },
  ],
};

module.exports = { defaultData };

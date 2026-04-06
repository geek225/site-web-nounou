function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function setCssVar(name, value) {
  if (typeof value !== "string" || value.trim() === "") return;
  document.documentElement.style.setProperty(name, value);
}

function applyDesign(settings) {
  const design = settings?.design;
  if (!design) return;
  setCssVar("--accent", design.accentColor);
  setCssVar("--bg", design.backgroundColor);
  setCssVar("--surface", design.surfaceColor);
  setCssVar("--text", design.textColor);
  setCssVar("--font", design.fontFamily);
}

function applySiteTitle(settings) {
  const title = typeof settings?.brand?.name === "string" && settings.brand.name.trim() ? settings.brand.name.trim() : "";
  if (title) document.title = title;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && title) ogTitle.setAttribute("content", title);
}

function bindText(data) {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    const value = getByPath(data, key);
    if (value === undefined || value === null) return;

    if (el.tagName === "IMG") {
      el.src = value;
      return;
    }

    if (el.id === "contactEmail") {
      el.textContent = value;
      el.href = `mailto:${value}`;
      return;
    }

    if (el.id === "contactPhone") {
      el.textContent = value;
      el.href = `tel:${value.replace(/\s+/g, "")}`;
      return;
    }

    el.textContent = String(value);
  });
}

function renderNavigation(settings) {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  const fallback = [
    { label: "Accueil", target: "#accueil" },
    { label: "À propos", target: "#apropos" },
    { label: "Nos services", target: "#services" },
    { label: "Contact", target: "#contact" },
  ];

  const items = Array.isArray(settings?.navigation?.items) && settings.navigation.items.length ? settings.navigation.items : fallback;
  nav.innerHTML = "";

  items.forEach((it) => {
    const label = typeof it?.label === "string" ? it.label : "";
    const target = typeof it?.target === "string" ? it.target : "";
    if (!label || !target) return;

    const a = document.createElement("a");
    a.className = "nav-link";
    a.href = target.startsWith("#") ? target : `#${target}`;
    a.textContent = label;
    nav.appendChild(a);
  });
}

function renderFooterLinks(settings) {
  const root = document.getElementById("footerLinks") || document.querySelector(".footer-links");
  if (!root) return;

  const fallback = [
    { label: "Accueil", target: "#accueil" },
    { label: "À propos", target: "#apropos" },
    { label: "Nos services", target: "#services" },
    { label: "Contact", target: "#contact" },
  ];

  const items = Array.isArray(settings?.navigation?.items) && settings.navigation.items.length ? settings.navigation.items : fallback;
  root.innerHTML = "";

  items.forEach((it) => {
    const label = typeof it?.label === "string" ? it.label : "";
    const target = typeof it?.target === "string" ? it.target : "";
    if (!label || !target) return;

    const a = document.createElement("a");
    a.href = target.startsWith("#") ? target : `#${target}`;
    a.textContent = label;
    root.appendChild(a);
  });
}

function applyBrand(settings) {
  const logoUrl = settings?.brand?.logo?.url;
  const logo = document.getElementById("brandLogo");
  const logoFooter = document.getElementById("brandLogoFooter");
  const nameEls = Array.from(document.querySelectorAll(".brand-name"));
  const markEls = Array.from(document.querySelectorAll(".brand-mark"));

  const hasLogo = typeof logoUrl === "string" && logoUrl.trim().length > 0;
  if (logo) logo.style.display = hasLogo ? "block" : "none";
  if (logoFooter) logoFooter.style.display = hasLogo ? "block" : "none";

  nameEls.forEach((el) => {
    el.style.display = hasLogo ? "none" : "";
  });

  markEls.forEach((el) => {
    el.style.display = hasLogo ? "none" : "";
  });
}

function applyHeroCtas(settings) {
  const primaryHref = settings?.hero?.primaryCtaHref;
  const primaryEl = document.getElementById("heroPrimaryCta");
  if (primaryEl && typeof primaryHref === "string" && primaryHref.trim()) {
    primaryEl.href = primaryHref.trim();
  }
}

function applyHeaderCta(settings) {
  const href = settings?.headerCta?.href;
  const el = document.getElementById("headerCtaLink");
  if (el && typeof href === "string" && href.trim()) {
    el.href = href.trim();
  }
}

function renderSocialLinks(settings) {
  const contactRow = document.getElementById("contactSocialRow");
  const footerRow = document.getElementById("footerSocial");
  if (!contactRow && !footerRow) return;

  const fallback = [
    { icon: "IG", label: "Instagram", url: "#" },
    { icon: "X", label: "X", url: "#" },
    { icon: "IN", label: "LinkedIn", url: "#" },
  ];

  const links = Array.isArray(settings?.social?.links) && settings.social.links.length ? settings.social.links : fallback;

  if (contactRow) {
    contactRow.innerHTML = "";
    links.forEach((l) => {
      const url = typeof l?.url === "string" ? l.url.trim() : "";
      const icon = typeof l?.icon === "string" ? l.icon.trim() : "";
      const label = typeof l?.label === "string" ? l.label.trim() : "";
      if (!url || !label) return;
      const a = document.createElement("a");
      a.className = "social";
      a.href = url;
      a.target = url.startsWith("#") ? "_self" : "_blank";
      a.rel = url.startsWith("#") ? "" : "noopener noreferrer";
      a.setAttribute("aria-label", label);
      a.textContent = icon || label.slice(0, 2).toUpperCase();
      contactRow.appendChild(a);
    });
  }

  if (footerRow) {
    footerRow.innerHTML = "";
    links.forEach((l) => {
      const url = typeof l?.url === "string" ? l.url.trim() : "";
      const label = typeof l?.label === "string" ? l.label.trim() : "";
      if (!url || !label) return;
      const a = document.createElement("a");
      a.href = url;
      a.target = url.startsWith("#") ? "_self" : "_blank";
      a.rel = url.startsWith("#") ? "" : "noopener noreferrer";
      a.setAttribute("aria-label", label);
      a.textContent = label;
      footerRow.appendChild(a);
    });
  }
}

function setSectionVisibility(settings) {
  const order = settings?.layout?.sectionOrder || [];
  const enabled = settings?.layout?.sectionEnabled || {};

  const main = document.querySelector("main");
  if (main && Array.isArray(order) && order.length) {
    const sections = order
      .map((key) => document.querySelector(`[data-section="${key}"]`))
      .filter((section) => section && section.getAttribute("data-section") !== "newsletter")
      .filter(Boolean);
    sections.forEach((section) => main.appendChild(section));
  }

  document.querySelectorAll("[data-section]").forEach((section) => {
    const key = section.getAttribute("data-section");
    const isEnabled = enabled?.[key] ?? enabled?.get?.(key);
    section.style.display = isEnabled === false ? "none" : "";
  });

  const newsletter = document.querySelector('[data-section="newsletter"]');
  const footer = document.querySelector("footer");
  if (newsletter && footer && footer.parentNode) {
    footer.parentNode.insertBefore(newsletter, footer);
  }
}

function renderHeroStats(stats) {
  const root = document.getElementById("heroStats");
  if (!root) return;
  root.innerHTML = "";

  (stats || []).slice(0, 3).forEach((s) => {
    const card = document.createElement("div");
    card.className = "stat";

    const value = document.createElement("div");
    value.className = "stat-value";
    value.textContent = s.value || "";

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = s.label || "";

    card.appendChild(value);
    card.appendChild(label);
    root.appendChild(card);
  });
}

function renderServices(services) {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;
  grid.innerHTML = "";

  (services || []).forEach((s) => {
    const card = document.createElement("div");
    card.className = "card service-card";

    const media = document.createElement("div");
    media.className = "service-media";
    const img = document.createElement("img");
    img.alt = s.title || "Service";
    img.loading = "lazy";
    img.src =
      s?.media?.url ||
      `https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80`;
    media.appendChild(img);

    const title = document.createElement("h3");
    title.className = "service-title";
    title.textContent = s.title || "";

    const desc = document.createElement("p");
    desc.className = "service-desc";
    desc.textContent = s.description || "";

    card.appendChild(media);
    card.appendChild(title);
    card.appendChild(desc);
    grid.appendChild(card);
  });
}

function renderGallery(destinations) {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  grid.innerHTML = "";

  (destinations || []).forEach((d) => {
    const card = document.createElement("a");
    card.className = "gallery-item";
    card.href = "#contact";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = d.title || "Destination";
    img.src =
      d?.media?.url ||
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

    const meta = document.createElement("div");
    meta.className = "gallery-meta";

    const left = document.createElement("div");
    const title = document.createElement("p");
    title.className = "gallery-title";
    title.textContent = d.title || "";
    const loc = document.createElement("p");
    loc.className = "gallery-loc";
    loc.textContent = d.location || d.description || "";
    left.appendChild(title);
    left.appendChild(loc);

    meta.appendChild(left);

    card.appendChild(img);
    card.appendChild(meta);
    grid.appendChild(card);
  });
}

function renderTestimonials(items) {
  const wrapper = document.getElementById("testiSwiperWrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  (items || []).forEach((t) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const card = document.createElement("div");
    card.className = "testi-card";

    const quote = document.createElement("p");
    quote.className = "testi-quote";
    quote.textContent = t.quote || "";

    const person = document.createElement("div");
    person.className = "testi-person";

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.alt = t.name || "Client";
    avatar.loading = "lazy";
    avatar.src = t?.avatar?.url || "https://i.pravatar.cc/120?img=13";

    const meta = document.createElement("div");
    const name = document.createElement("div");
    name.className = "person-name";
    name.textContent = t.name || "";
    const role = document.createElement("div");
    role.className = "person-role";
    role.textContent = t.role || "";
    meta.appendChild(name);
    meta.appendChild(role);

    person.appendChild(avatar);
    person.appendChild(meta);

    card.appendChild(quote);
    card.appendChild(person);
    slide.appendChild(card);
    wrapper.appendChild(slide);
  });

  new Swiper("#testiSwiper", {
    slidesPerView: 1,
    spaceBetween: 14,
    loop: true,
    autoplay: { delay: 3600, disableOnInteraction: false },
    pagination: { el: "#testiSwiper .swiper-pagination", clickable: true },
    breakpoints: {
      860: { slidesPerView: 3 },
      560: { slidesPerView: 2 },
    },
  });
}

function normalizeFourImages(sliderImages) {
  const source = Array.isArray(sliderImages) ? sliderImages.filter((x) => x && x.url) : [];
  const imgs = [];
  if (source.length === 0) {
    for (let i = 0; i < 4; i += 1) imgs.push({ url: "" });
  } else {
    for (let i = 0; i < 4; i += 1) imgs.push(source[i % source.length]);
  }
  return imgs;
}

function renderHeroSlider(hero) {
  const wrapper = document.getElementById("heroSwiperWrapper");
  const wrapperRound = document.getElementById("heroSwiperWrapperRound");
  if (!wrapper || !wrapperRound) return;
  wrapper.innerHTML = "";
  wrapperRound.innerHTML = "";

  const imgs = normalizeFourImages(hero?.sliderImages);
  const roundImgs = normalizeFourImages(hero?.roundSliderImages || hero?.sliderImages);
  function appendSlides(target) {
    target.innerHTML = "";
    (target === wrapper ? imgs : roundImgs).forEach((i) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      const inner = document.createElement("div");
      inner.className = "slide-img";
      inner.style.backgroundImage = `url("${i.url}")`;
      slide.appendChild(inner);
      target.appendChild(slide);
    });
  }

  appendSlides(wrapper);
  appendSlides(wrapperRound);

  const swiper1 = document.getElementById("heroSwiper")?.swiper;
  if (swiper1) swiper1.destroy(true, true);
  const swiperRound = document.getElementById("heroSwiperRound")?.swiper;
  if (swiperRound) swiperRound.destroy(true, true);

  new Swiper("#heroSwiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    speed: 700,
    autoplay: { delay: 2800, disableOnInteraction: false },
    coverflowEffect: {
      rotate: 0,
      stretch: 24,
      depth: 180,
      modifier: 1,
      slideShadows: false,
    },
    pagination: { el: "#heroSwiper .swiper-pagination", clickable: true },
  });

  new Swiper("#heroSwiperRound", {
    slidesPerView: "auto",
    centeredSlides: true,
    loop: true,
    speed: 700,
    autoplay: { delay: 3200, disableOnInteraction: false, reverseDirection: true },
  });
}

function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12 },
  );

  items.forEach((el) => io.observe(el));
  setTimeout(() => items.slice(0, 6).forEach((el) => el.classList.add("visible")), 60);
}

function toEmbedUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  } catch {
    return url;
  }
}

function initVideoModal(videoUrl) {
  const btn = document.getElementById("videoBtn");
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("videoFrame");
  if (!btn || !modal || !frame) return;

  function open() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    frame.src = toEmbedUrl(videoUrl);
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    frame.src = "";
  }

  btn.addEventListener("click", open);
  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.getAttribute && target.getAttribute("data-close") === "true") close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const hint = document.getElementById("contactHint");
  if (!form || !hint) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hint.textContent = "Envoi en cours…";
    await new Promise((r) => setTimeout(r, 650));
    hint.textContent = "Message envoyé. Nous revenons vers vous très vite.";
    form.reset();
  });
}

function initNewsletterForm(settings) {
  const form = document.getElementById("newsletterForm");
  const hint = document.getElementById("newsletterHint");
  const email = document.getElementById("newsletterEmail");
  if (!form || !hint || !email) return;

  const placeholder = settings?.newsletter?.placeholder;
  if (typeof placeholder === "string" && placeholder.trim()) {
    email.placeholder = placeholder;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hint.textContent = "Inscription…";
    await new Promise((r) => setTimeout(r, 650));
    hint.textContent = "Merci, vous êtes inscrit(e).";
    form.reset();
  });
}

async function bootstrap() {
  const res = await fetch("/api/public/bootstrap");
  const data = await res.json();

  applyDesign(data.settings);
  applySiteTitle(data.settings);
  bindText(data.settings);
  renderNavigation(data.settings);
  renderFooterLinks(data.settings);
  applyBrand(data.settings);
  renderSocialLinks(data.settings);
  applyHeroCtas(data.settings);
  applyHeaderCta(data.settings);
  const heroTitleEl = document.querySelector('[data-bind="hero.title"]');
  if (heroTitleEl && heroTitleEl.textContent.includes("Destinations")) {
    heroTitleEl.innerHTML = escapeTitle(heroTitleEl.textContent);
  }
  setSectionVisibility(data.settings);

  const subtitleEl = document.querySelector('[data-bind="hero.subtitle"]');
  if (subtitleEl && !subtitleEl.textContent) subtitleEl.textContent = data?.settings?.hero?.subtitle || "";

  renderHeroStats(data?.settings?.hero?.stats || []);
  renderHeroSlider(data?.settings?.hero || {});

  const aboutImage = document.getElementById("aboutImage");
  const aboutImgUrl = data?.settings?.about?.image?.url;
  if (aboutImage && aboutImgUrl) aboutImage.src = aboutImgUrl;

  renderServices(data.services);
  renderGallery(data.otherServices);
  renderTestimonials(data.testimonials);

  initVideoModal(data?.settings?.hero?.videoUrl || "");
  initReveal();
  initContactForm();
  initNewsletterForm(data?.settings);
}

bootstrap().catch(() => {
  initReveal();
});

function escapeTitle(title) {
  const safe = title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const idx = safe.indexOf("Destinations");
  if (idx === -1) return safe;
  return `${safe.slice(0, idx)}<em>Destinations</em>${safe.slice(idx + "Destinations".length)}`;
}

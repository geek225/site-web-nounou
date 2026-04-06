const storageKey = "admin_token";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tokenGet() {
  return localStorage.getItem(storageKey);
}

function tokenSet(token) {
  localStorage.setItem(storageKey, token);
}

function tokenClear() {
  localStorage.removeItem(storageKey);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.json) headers.set("Content-Type", "application/json");
  const token = tokenGet();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  if (res.status === 401) {
    tokenClear();
    location.hash = "#/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return json;
}

function viewRoot() {
  return document.getElementById("app");
}

function renderLogin() {
  const root = viewRoot();
  root.innerHTML = `
    <div class="login">
      <div class="login-card">
        <div class="login-head">
          <div class="brand" style="box-shadow:none">
            <span class="mark"></span>
            <div>
              <h1>Admin</h1>
              <p>Nounou Travel</p>
            </div>
          </div>
          <a class="btn btn-ghost" href="/">Site</a>
        </div>
        <div class="row">
          <div class="field full">
            <label>Email</label>
            <input id="loginEmail" type="email" placeholder="admin@example.com" />
          </div>
          <div class="field full">
            <label>Mot de passe</label>
            <input id="loginPassword" type="password" placeholder="••••••••" />
          </div>
          <div class="field full">
            <button class="btn btn-primary" id="loginBtn" type="button">Connexion</button>
            <p class="hint" id="loginHint"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  const email = qs("#loginEmail");
  const pass = qs("#loginPassword");
  const btn = qs("#loginBtn");
  const hint = qs("#loginHint");

  btn.addEventListener("click", async () => {
    hint.textContent = "Connexion…";
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        json: { email: email.value.trim(), password: pass.value },
      });
      tokenSet(res.token);
      location.hash = "#/app/settings";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

const state = {
  section: "settings",
  settings: null,
  services: [],
  otherServices: [],
  testimonials: [],
};

const sections = [
  { key: "settings", label: "Aperçu" },
  { key: "hero", label: "Hero" },
  { key: "about", label: "À propos" },
  { key: "content", label: "Contenu" },
  { key: "navigation", label: "Menu" },
  { key: "social", label: "Réseaux" },
  { key: "services", label: "Services" },
  { key: "other-services", label: "Autres services" },
  { key: "testimonials", label: "Témoignages" },
  { key: "design", label: "Design" },
  { key: "layout", label: "Layout" },
  { key: "contact", label: "Contact" },
  { key: "media", label: "Médias" },
];

function renderShell() {
  const root = viewRoot();
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="mark"></span>
          <div>
            <h1>${escapeHtml(state?.settings?.brand?.name || "Nounou")}</h1>
            <p>Dashboard admin</p>
          </div>
        </div>
        <div class="nav" id="nav"></div>
        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <a class="btn btn-ghost" href="/" style="flex:1">Site</a>
          <button class="btn btn-ghost" id="logoutBtn" style="flex:1" type="button">Logout</button>
        </div>
      </aside>
      <main class="content">
        <div class="topbar">
          <div>
            <h1 class="title" id="pageTitle"></h1>
            <div class="muted">Les changements sont appliqués sur le site via l’API.</div>
          </div>
          <button class="btn btn-primary" id="refreshBtn" type="button">Rafraîchir</button>
        </div>
        <div class="grid" id="page"></div>
      </main>
    </div>
  `;

  const nav = qs("#nav");
  sections.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = s.label;
    btn.className = s.key === state.section ? "active" : "";
    btn.addEventListener("click", () => {
      location.hash = `#/app/${s.key}`;
    });
    nav.appendChild(btn);
  });

  qs("#logoutBtn").addEventListener("click", () => {
    tokenClear();
    location.hash = "#/login";
  });

  qs("#refreshBtn").addEventListener("click", async () => {
    await loadAll();
    renderShell();
    renderSection();
  });
}

async function loadAll() {
  const [settingsRes, servicesRes, otherServicesRes, testiRes] = await Promise.all([
    apiFetch("/api/admin/settings"),
    apiFetch("/api/admin/services"),
    apiFetch("/api/admin/other-services"),
    apiFetch("/api/admin/testimonials"),
  ]);

  state.settings = settingsRes.settings;
  state.services = servicesRes.items;
  state.otherServices = otherServicesRes.items;
  state.testimonials = testiRes.items;
}

function setTitle(label) {
  qs("#pageTitle").textContent = label;
}

function page() {
  return qs("#page");
}

async function saveSettings(patch) {
  const res = await apiFetch("/api/admin/settings", { method: "PUT", json: patch });
  state.settings = res.settings;
  return res.settings;
}

async function uploadFile(file, folder) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  return apiFetch("/api/admin/upload", { method: "POST", body: fd });
}

function card(title, innerHtml) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `<h2>${escapeHtml(title)}</h2>${innerHtml}`;
  return div;
}

function renderOverview() {
  setTitle("Aperçu");
  const p = page();
  const s = state.settings;
  p.innerHTML = "";

  const design = s?.design || {};
  const brand = s?.brand || {};
  const layout = s?.layout || {};

  p.appendChild(
    card(
      "Résumé",
      `
        <div class="row">
          <div class="field third">
            <label>Brand</label>
            <input value="${escapeHtml(brand.name || "")}" disabled />
          </div>
          <div class="field third">
            <label>Accent</label>
            <input value="${escapeHtml(design.accentColor || "")}" disabled />
          </div>
          <div class="field third">
            <label>Sections</label>
            <input value="${escapeHtml((layout.sectionOrder || []).join(" → "))}" disabled />
          </div>
        </div>
      `,
    ),
  );
}

function renderHero() {
  setTitle("Hero");
  const p = page();
  const s = state.settings;
  p.innerHTML = "";

  const stats = Array.isArray(s?.hero?.stats) ? s.hero.stats : [];
  const images = Array.isArray(s?.hero?.sliderImages) ? s.hero.sliderImages : [];
  const roundImages = Array.isArray(s?.hero?.roundSliderImages) ? s.hero.roundSliderImages : [];

  const statsHtml = stats
    .map(
      (st, idx) => `
        <div class="row" data-stat-row="${idx}">
          <div class="field third">
            <label>Value</label>
            <input data-stat-value="${idx}" value="${escapeHtml(st.value || "")}" />
          </div>
          <div class="field third">
            <label>Label</label>
            <input data-stat-label="${idx}" value="${escapeHtml(st.label || "")}" />
          </div>
          <div class="field third">
            <button class="btn btn-ghost" type="button" data-stat-del="${idx}">Supprimer</button>
          </div>
        </div>
      `,
    )
    .join("");

  const imagesHtml = images
    .map(
      (img, idx) => `
        <div class="item">
          <div style="display:flex; align-items:center; gap:10px; min-width:0">
            <img class="thumb" src="${escapeHtml(img.url || "")}" alt="" />
            <div style="min-width:0">
              <strong>Image ${idx + 1}</strong>
              <span style="word-break:break-all">${escapeHtml(img.url || "")}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn btn-ghost" type="button" data-heroimg-url="${idx}">Remplacer URL</button>
            <button class="btn btn-ghost" type="button" data-heroimg-upload="${idx}">Remplacer upload</button>
            <button class="btn btn-ghost" type="button" data-heroimg-del="${idx}">Supprimer</button>
          </div>
        </div>
      `,
    )
    .join("");

  const roundImagesHtml = roundImages
    .map(
      (img, idx) => `
        <div class="item">
          <div style="display:flex; align-items:center; gap:10px; min-width:0">
            <img class="thumb" src="${escapeHtml(img.url || "")}" alt="" />
            <div style="min-width:0">
              <strong>Image ${idx + 1}</strong>
              <span style="word-break:break-all">${escapeHtml(img.url || "")}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn btn-ghost" type="button" data-heroround-url="${idx}">Remplacer URL</button>
            <button class="btn btn-ghost" type="button" data-heroround-upload="${idx}">Remplacer upload</button>
            <button class="btn btn-ghost" type="button" data-heroround-del="${idx}">Supprimer</button>
          </div>
        </div>
      `,
    )
    .join("");

  p.appendChild(
    card(
      "Texte & boutons",
      `
      <div class="row">
        <div class="field full">
          <label>Petit titre (au-dessus du hero)</label>
          <input id="heroKicker" value="${escapeHtml(s?.hero?.kickerText || "")}" placeholder="Premium Travel Studio" />
        </div>
        <div class="field full">
          <label>Titre</label>
          <textarea id="heroTitle">${escapeHtml(s?.hero?.title || "")}</textarea>
        </div>
        <div class="field full">
          <label>Sous-texte</label>
          <textarea id="heroSubtitle">${escapeHtml(s?.hero?.subtitle || "")}</textarea>
        </div>
        <div class="field">
          <label>CTA primaire</label>
          <input id="heroPrimary" value="${escapeHtml(s?.hero?.primaryCtaText || "")}" />
        </div>
        <div class="field">
          <label>Lien CTA primaire</label>
          <input id="heroPrimaryHref" value="${escapeHtml(s?.hero?.primaryCtaHref || "")}" placeholder="#destinations" />
        </div>
        <div class="field">
          <label>CTA secondaire</label>
          <input id="heroSecondary" value="${escapeHtml(s?.hero?.secondaryCtaText || "")}" />
        </div>
        <div class="field full">
          <label>URL vidéo</label>
          <input id="heroVideo" value="${escapeHtml(s?.hero?.videoUrl || "")}" />
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveHeroText">Enregistrer</button>
          <p class="hint" id="heroTextHint"></p>
        </div>
      </div>
    `,
    ),
  );

  p.appendChild(
    card(
      "Stats",
      `
      <div class="row">
        <div class="field full">
          <button class="btn btn-ghost" type="button" id="addStat">Ajouter une stat</button>
        </div>
        <div class="field full">
          ${statsHtml || `<div class="muted">Aucune stat.</div>`}
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveStats">Enregistrer</button>
          <p class="hint" id="statsHint"></p>
        </div>
      </div>
    `,
    ),
  );

  p.appendChild(
    card(
      "Images slider",
      `
      <div class="row">
        <div class="field full">
          <label>Ajouter via URL</label>
          <input id="heroImgUrl" placeholder="https://..." />
        </div>
        <div class="field">
          <label>Ou upload</label>
          <input id="heroImgFile" type="file" accept="image/*" />
        </div>
        <div class="field">
          <label>Dossier Cloudinary</label>
          <input id="heroImgFolder" value="nounou/hero" />
        </div>
        <div class="field">
          <button class="btn btn-primary" type="button" id="addHeroImg">Ajouter</button>
        </div>
        <input id="heroReplaceFile" type="file" accept="image/*" style="display:none" />
        <div class="field full">
          <div class="list" id="heroImgList">${imagesHtml || `<div class="muted">Aucune image.</div>`}</div>
        </div>
      </div>
    `,
    ),
  );

  p.appendChild(
    card(
      "Images slider (rond)",
      `
      <div class="row">
        <div class="field full">
          <label>Ajouter via URL</label>
          <input id="heroRoundUrl" placeholder="https://..." />
        </div>
        <div class="field">
          <label>Ou upload</label>
          <input id="heroRoundFile" type="file" accept="image/*" />
        </div>
        <div class="field">
          <label>Dossier Cloudinary</label>
          <input id="heroRoundFolder" value="nounou/hero-round" />
        </div>
        <div class="field">
          <button class="btn btn-primary" type="button" id="addHeroRound">Ajouter</button>
        </div>
        <input id="heroRoundReplaceFile" type="file" accept="image/*" style="display:none" />
        <div class="field full">
          <div class="list" id="heroRoundList">${roundImagesHtml || `<div class="muted">Aucune image.</div>`}</div>
        </div>
      </div>
    `,
    ),
  );

  qs("#saveHeroText").addEventListener("click", async () => {
    const hint = qs("#heroTextHint");
    hint.textContent = "Enregistrement…";
    try {
      await saveSettings({
        hero: {
          kickerText: qs("#heroKicker").value,
          title: qs("#heroTitle").value,
          subtitle: qs("#heroSubtitle").value,
          primaryCtaText: qs("#heroPrimary").value,
          primaryCtaHref: qs("#heroPrimaryHref").value,
          secondaryCtaText: qs("#heroSecondary").value,
          videoUrl: qs("#heroVideo").value,
        },
      });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });

  qs("#addStat").addEventListener("click", () => {
    state.settings.hero.stats = [...(state.settings.hero.stats || []), { value: "", label: "" }];
    renderHero();
  });

  qsa("[data-stat-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-stat-del"));
      state.settings.hero.stats = (state.settings.hero.stats || []).filter((_, i) => i !== idx);
      renderHero();
    });
  });

  qs("#saveStats").addEventListener("click", async () => {
    const hint = qs("#statsHint");
    hint.textContent = "Enregistrement…";
    try {
      const nextStats = (state.settings.hero.stats || []).map((_, idx) => ({
        value: qs(`[data-stat-value="${idx}"]`)?.value || "",
        label: qs(`[data-stat-label="${idx}"]`)?.value || "",
      }));
      await saveSettings({ hero: { stats: nextStats } });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });

  qsa("[data-heroimg-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-heroimg-del"));
      const next = (state.settings.hero.sliderImages || []).filter((_, i) => i !== idx);
      try {
        await saveSettings({ hero: { sliderImages: next } });
        state.settings.hero.sliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  });

  qsa("[data-heroimg-url]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-heroimg-url"));
      const current = state.settings.hero.sliderImages || [];
      const existing = current[idx];
      if (!existing) return;

      const nextUrl = prompt("Nouvelle URL d'image :", existing.url || "");
      if (!nextUrl || !nextUrl.trim()) return;

      const next = current.map((x, i) => (i === idx ? { ...x, url: nextUrl.trim() } : x));
      try {
        await saveSettings({ hero: { sliderImages: next } });
        state.settings.hero.sliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  });

  let replaceIndex = null;
  const replaceInput = qs("#heroReplaceFile");
  if (replaceInput) {
    replaceInput.addEventListener("change", async () => {
      const file = replaceInput.files?.[0];
      if (!file) return;

      const idx = replaceIndex;
      replaceIndex = null;
      replaceInput.value = "";

      const folderInput = qs("#heroImgFolder");
      const folder = folderInput?.value || "nounou/hero";

      try {
        const uploaded = await uploadFile(file, folder);
        const current = state.settings.hero.sliderImages || [];
        if (typeof idx !== "number" || idx < 0 || idx >= current.length) return;
        const next = current.map((x, i) => (i === idx ? { url: uploaded.url, publicId: uploaded.publicId } : x));
        await saveSettings({ hero: { sliderImages: next } });
        state.settings.hero.sliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  }

  qsa("[data-heroimg-upload]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-heroimg-upload"));
      replaceIndex = idx;
      replaceInput?.click();
    });
  });

  qs("#addHeroImg").addEventListener("click", async () => {
    const urlInput = qs("#heroImgUrl");
    const fileInput = qs("#heroImgFile");
    const folderInput = qs("#heroImgFolder");

    let img = null;
    if (fileInput.files && fileInput.files[0]) {
      try {
        const uploaded = await uploadFile(fileInput.files[0], folderInput.value || "nounou/hero");
        img = { url: uploaded.url, publicId: uploaded.publicId };
      } catch (e) {
        alert(e.message || "Upload error");
        return;
      }
    } else if (urlInput.value.trim()) {
      img = { url: urlInput.value.trim() };
    }

    if (!img) return;
    state.settings.hero.sliderImages = [...(state.settings.hero.sliderImages || []), img];
    try {
      await saveSettings({ hero: { sliderImages: state.settings.hero.sliderImages } });
      urlInput.value = "";
      fileInput.value = "";
      renderHero();
    } catch (e) {
      alert(e.message || "Erreur");
    }
  });

  qsa("[data-heroround-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-heroround-del"));
      const next = (state.settings.hero.roundSliderImages || []).filter((_, i) => i !== idx);
      try {
        await saveSettings({ hero: { roundSliderImages: next } });
        state.settings.hero.roundSliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  });

  qsa("[data-heroround-url]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-heroround-url"));
      const current = state.settings.hero.roundSliderImages || [];
      const existing = current[idx];
      if (!existing) return;

      const nextUrl = prompt("Nouvelle URL d'image :", existing.url || "");
      if (!nextUrl || !nextUrl.trim()) return;

      const next = current.map((x, i) => (i === idx ? { ...x, url: nextUrl.trim() } : x));
      try {
        await saveSettings({ hero: { roundSliderImages: next } });
        state.settings.hero.roundSliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  });

  let roundReplaceIndex = null;
  const roundReplaceInput = qs("#heroRoundReplaceFile");
  if (roundReplaceInput) {
    roundReplaceInput.addEventListener("change", async () => {
      const file = roundReplaceInput.files?.[0];
      if (!file) return;

      const idx = roundReplaceIndex;
      roundReplaceIndex = null;
      roundReplaceInput.value = "";

      const folderInput = qs("#heroRoundFolder");
      const folder = folderInput?.value || "nounou/hero-round";

      try {
        const uploaded = await uploadFile(file, folder);
        const current = state.settings.hero.roundSliderImages || [];
        if (typeof idx !== "number" || idx < 0 || idx >= current.length) return;
        const next = current.map((x, i) => (i === idx ? { url: uploaded.url, publicId: uploaded.publicId } : x));
        await saveSettings({ hero: { roundSliderImages: next } });
        state.settings.hero.roundSliderImages = next;
        renderHero();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  }

  qsa("[data-heroround-upload]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-heroround-upload"));
      roundReplaceIndex = idx;
      roundReplaceInput?.click();
    });
  });

  qs("#addHeroRound").addEventListener("click", async () => {
    const urlInput = qs("#heroRoundUrl");
    const fileInput = qs("#heroRoundFile");
    const folderInput = qs("#heroRoundFolder");

    let img = null;
    if (fileInput.files && fileInput.files[0]) {
      try {
        const uploaded = await uploadFile(fileInput.files[0], folderInput.value || "nounou/hero-round");
        img = { url: uploaded.url, publicId: uploaded.publicId };
      } catch (e) {
        alert(e.message || "Upload error");
        return;
      }
    } else if (urlInput.value.trim()) {
      img = { url: urlInput.value.trim() };
    }

    if (!img) return;
    state.settings.hero.roundSliderImages = [...(state.settings.hero.roundSliderImages || []), img];
    try {
      await saveSettings({ hero: { roundSliderImages: state.settings.hero.roundSliderImages } });
      urlInput.value = "";
      fileInput.value = "";
      renderHero();
    } catch (e) {
      alert(e.message || "Erreur");
    }
  });
}

function renderAbout() {
  setTitle("À propos");
  const p = page();
  const s = state.settings;
  p.innerHTML = "";

  p.appendChild(
    card(
      "Contenu",
      `
      <div class="row">
        <div class="field">
          <label>Titre</label>
          <input id="aboutTitle" value="${escapeHtml(s?.about?.title || "")}" />
        </div>
        <div class="field full">
          <label>Texte</label>
          <textarea id="aboutText">${escapeHtml(s?.about?.text || "")}</textarea>
        </div>
        <div class="field">
          <label>Image (upload)</label>
          <input id="aboutFile" type="file" accept="image/*" />
        </div>
        <div class="field">
          <label>Dossier Cloudinary</label>
          <input id="aboutFolder" value="nounou/about" />
        </div>
        <div class="field third">
          <button class="btn btn-primary" type="button" id="saveAbout">Enregistrer</button>
          <p class="hint" id="aboutHint"></p>
        </div>
        <div class="field full">
          <div class="item">
            <div style="display:flex; align-items:center; gap:10px; min-width:0">
              <img class="thumb" src="${escapeHtml(s?.about?.image?.url || "")}" alt="" />
              <div style="min-width:0">
                <strong>Image actuelle</strong>
                <span style="word-break:break-all">${escapeHtml(s?.about?.image?.url || "")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    ),
  );

  qs("#saveAbout").addEventListener("click", async () => {
    const hint = qs("#aboutHint");
    hint.textContent = "Enregistrement…";
    try {
      let image = s?.about?.image || {};
      const file = qs("#aboutFile").files?.[0];
      if (file) {
        const uploaded = await uploadFile(file, qs("#aboutFolder").value || "nounou/about");
        image = { url: uploaded.url, publicId: uploaded.publicId };
      }

      await saveSettings({
        about: { title: qs("#aboutTitle").value, text: qs("#aboutText").value, image },
      });
      hint.textContent = "Enregistré.";
      renderShell();
      renderAbout();
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderContent() {
  setTitle("Contenu");
  const p = page();
  const s = state.settings || {};
  p.innerHTML = "";

  p.appendChild(
    card(
      "Textes",
      `
      <div class="row">
        <div class="field">
          <label>Titre Services</label>
          <input id="srvSectionTitle" value="${escapeHtml(s?.servicesSection?.title || "")}" placeholder="Nos services" />
        </div>
        <div class="field full">
          <label>Sous-titre Services</label>
          <textarea id="srvSectionSubtitle">${escapeHtml(s?.servicesSection?.subtitle || "")}</textarea>
        </div>
        <div class="field">
          <label>Titre Autres services</label>
          <input id="gTitle" value="${escapeHtml(s?.gallery?.title || "")}" placeholder="Autres services" />
        </div>
        <div class="field full">
          <label>Sous-titre Autres services</label>
          <textarea id="gSubtitle">${escapeHtml(s?.gallery?.subtitle || "")}</textarea>
        </div>
        <div class="field">
          <label>Titre Newsletter</label>
          <input id="nTitle" value="${escapeHtml(s?.newsletter?.title || "")}" placeholder="Newsletter" />
        </div>
        <div class="field full">
          <label>Texte Newsletter</label>
          <textarea id="nText">${escapeHtml(s?.newsletter?.text || "")}</textarea>
        </div>
        <div class="field">
          <label>Placeholder email</label>
          <input id="nPlaceholder" value="${escapeHtml(s?.newsletter?.placeholder || "")}" placeholder="Votre email" />
        </div>
        <div class="field">
          <label>Texte bouton</label>
          <input id="nButton" value="${escapeHtml(s?.newsletter?.buttonText || "")}" placeholder="S’inscrire" />
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveContent">Enregistrer</button>
          <p class="hint" id="contentHint"></p>
        </div>
      </div>
    `,
    ),
  );

  qs("#saveContent").addEventListener("click", async () => {
    const hint = qs("#contentHint");
    hint.textContent = "Enregistrement…";
    try {
      await saveSettings({
        servicesSection: {
          title: qs("#srvSectionTitle").value,
          subtitle: qs("#srvSectionSubtitle").value,
        },
        gallery: {
          title: qs("#gTitle").value,
          subtitle: qs("#gSubtitle").value,
        },
        newsletter: {
          title: qs("#nTitle").value,
          text: qs("#nText").value,
          placeholder: qs("#nPlaceholder").value,
          buttonText: qs("#nButton").value,
        },
      });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderNavigation() {
  setTitle("Menu");
  const p = page();
  const s = state.settings || {};
  const headerCta = s?.headerCta || {};
  const fallback = [
    { label: "Accueil", target: "#accueil" },
    { label: "À propos", target: "#apropos" },
    { label: "Nos services", target: "#services" },
    { label: "Contact", target: "#contact" },
  ];

  const currentItems =
    Array.isArray(s?.navigation?.items) && s.navigation.items.length ? s.navigation.items : fallback;

  p.innerHTML = "";

  const itemsHtml = currentItems
    .map(
      (it, idx) => `
      <li class="layout-li" data-idx="${idx}">
        <div style="display:flex; flex-direction:column; gap:2px; width:100%">
          <strong style="font-size:12px">Lien</strong>
          <div class="row" style="margin-top:8px">
            <div class="field">
              <label>Label</label>
              <input data-nav-label="${idx}" value="${escapeHtml(it?.label || "")}" />
            </div>
            <div class="field">
              <label>Target</label>
              <input data-nav-target="${idx}" value="${escapeHtml(it?.target || "")}" placeholder="#contact" />
            </div>
            <div class="field third">
              <button class="btn btn-ghost" type="button" data-nav-del="${idx}">Supprimer</button>
            </div>
          </div>
        </div>
      </li>
    `,
    )
    .join("");

  p.appendChild(
    card(
      "Navigation",
      `
      <div class="row">
        <div class="field">
          <label>Bouton CTA (texte)</label>
          <input id="headerCtaText" value="${escapeHtml(headerCta.text || "")}" placeholder="Formulaire" />
        </div>
        <div class="field">
          <label>Bouton CTA (lien)</label>
          <input id="headerCtaHref" value="${escapeHtml(headerCta.href || "")}" placeholder="/formulaire.html" />
        </div>
        <div class="field full">
          <button class="btn btn-ghost" type="button" id="navAdd">Ajouter un lien</button>
        </div>
        <div class="field full">
          <ul class="layout-list" id="navList">${itemsHtml}</ul>
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="navSave">Enregistrer</button>
          <p class="hint" id="navHint"></p>
        </div>
      </div>
    `,
    ),
  );

  const list = qs("#navList");
  new Sortable(list, { animation: 150 });

  qs("#navAdd").addEventListener("click", () => {
    const items = Array.isArray(state.settings?.navigation?.items) ? state.settings.navigation.items : fallback;
    state.settings.navigation = { items: [...items, { label: "", target: "#contact" }] };
    renderNavigation();
  });

  qsa("[data-nav-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-nav-del"));
      const items = Array.isArray(state.settings?.navigation?.items) ? state.settings.navigation.items : fallback;
      state.settings.navigation = { items: items.filter((_, i) => i !== idx) };
      renderNavigation();
    });
  });

  qs("#navSave").addEventListener("click", async () => {
    const hint = qs("#navHint");
    hint.textContent = "Enregistrement…";
    try {
      const nextOrder = qsa(".layout-li", list).map((li) => Number(li.getAttribute("data-idx")));
      const sourceItems = Array.isArray(state.settings?.navigation?.items) ? state.settings.navigation.items : fallback;

      const nextItems = nextOrder
        .map((idx) => ({
          label: qs(`[data-nav-label="${idx}"]`)?.value || "",
          target: qs(`[data-nav-target="${idx}"]`)?.value || "",
        }))
        .filter((x) => x.label.trim() && x.target.trim());

      const merged = nextItems.length ? nextItems : sourceItems;
      await saveSettings({
        headerCta: { text: qs("#headerCtaText").value, href: qs("#headerCtaHref").value },
        navigation: { items: merged },
      });
      hint.textContent = "Enregistré.";
      renderShell();
      renderNavigation();
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderSocial() {
  setTitle("Réseaux");
  const p = page();
  const s = state.settings || {};

  const fallback = [
    { icon: "IG", label: "Instagram", url: "#" },
    { icon: "X", label: "X", url: "#" },
    { icon: "IN", label: "LinkedIn", url: "#" },
  ];

  const currentLinks =
    Array.isArray(s?.social?.links) && s.social.links.length ? s.social.links : fallback;

  p.innerHTML = "";

  const linksHtml = currentLinks
    .map(
      (it, idx) => `
      <li class="layout-li" data-idx="${idx}">
        <div style="display:flex; flex-direction:column; gap:2px; width:100%">
          <strong style="font-size:12px">Réseau</strong>
          <div class="row" style="margin-top:8px">
            <div class="field third">
              <label>Icône (texte)</label>
              <input data-social-icon="${idx}" value="${escapeHtml(it?.icon || "")}" placeholder="IG" />
            </div>
            <div class="field">
              <label>Label</label>
              <input data-social-label="${idx}" value="${escapeHtml(it?.label || "")}" placeholder="Instagram" />
            </div>
            <div class="field full">
              <label>Lien</label>
              <input data-social-url="${idx}" value="${escapeHtml(it?.url || "")}" placeholder="https://..." />
            </div>
            <div class="field third">
              <button class="btn btn-ghost" type="button" data-social-del="${idx}">Supprimer</button>
            </div>
          </div>
        </div>
      </li>
    `,
    )
    .join("");

  p.appendChild(
    card(
      "Réseaux sociaux",
      `
      <div class="row">
        <div class="field full">
          <button class="btn btn-ghost" type="button" id="socialAdd">Ajouter un réseau</button>
        </div>
        <div class="field full">
          <ul class="layout-list" id="socialList">${linksHtml}</ul>
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="socialSave">Enregistrer</button>
          <p class="hint" id="socialHint"></p>
        </div>
      </div>
    `,
    ),
  );

  const list = qs("#socialList");
  new Sortable(list, { animation: 150 });

  qs("#socialAdd").addEventListener("click", () => {
    const links = Array.isArray(state.settings?.social?.links) ? state.settings.social.links : fallback;
    state.settings.social = { links: [...links, { icon: "", label: "", url: "" }] };
    renderSocial();
  });

  qsa("[data-social-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-social-del"));
      const links = Array.isArray(state.settings?.social?.links) ? state.settings.social.links : fallback;
      state.settings.social = { links: links.filter((_, i) => i !== idx) };
      renderSocial();
    });
  });

  qs("#socialSave").addEventListener("click", async () => {
    const hint = qs("#socialHint");
    hint.textContent = "Enregistrement…";
    try {
      const nextOrder = qsa(".layout-li", list).map((li) => Number(li.getAttribute("data-idx")));
      const sourceLinks = Array.isArray(state.settings?.social?.links) ? state.settings.social.links : fallback;

      const nextLinks = nextOrder
        .map((idx) => ({
          icon: qs(`[data-social-icon="${idx}"]`)?.value || "",
          label: qs(`[data-social-label="${idx}"]`)?.value || "",
          url: qs(`[data-social-url="${idx}"]`)?.value || "",
        }))
        .filter((x) => x.label.trim() && x.url.trim());

      const merged = nextLinks.length ? nextLinks : sourceLinks;
      await saveSettings({ social: { links: merged } });
      hint.textContent = "Enregistré.";
      renderShell();
      renderSocial();
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderContact() {
  setTitle("Contact");
  const p = page();
  const s = state.settings;
  p.innerHTML = "";

  p.appendChild(
    card(
      "Infos",
      `
      <div class="row">
        <div class="field">
          <label>Email</label>
          <input id="cEmail" value="${escapeHtml(s?.contact?.email || "")}" />
        </div>
        <div class="field">
          <label>Téléphone</label>
          <input id="cPhone" value="${escapeHtml(s?.contact?.phone || "")}" />
        </div>
        <div class="field full">
          <label>Adresse</label>
          <input id="cAddr" value="${escapeHtml(s?.contact?.address || "")}" />
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveContact">Enregistrer</button>
          <p class="hint" id="contactHint"></p>
        </div>
      </div>
    `,
    ),
  );

  qs("#saveContact").addEventListener("click", async () => {
    const hint = qs("#contactHint");
    hint.textContent = "Enregistrement…";
    try {
      await saveSettings({
        contact: {
          email: qs("#cEmail").value,
          phone: qs("#cPhone").value,
          address: qs("#cAddr").value,
        },
      });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderDesign() {
  setTitle("Design");
  const p = page();
  const s = state.settings;
  const d = s?.design || {};
  p.innerHTML = "";

  p.appendChild(
    card(
      "Couleurs & typographie",
      `
      <div class="row">
        <div class="field">
          <label>Accent</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input id="dAccentPicker" type="color" value="${escapeHtml(d.accentColor || "#ff3b3b")}" style="width:48px; height:42px; padding:0; border-radius:12px;" />
            <input id="dAccent" value="${escapeHtml(d.accentColor || "")}" placeholder="#FF3B3B" />
          </div>
        </div>
        <div class="field">
          <label>Fond</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input id="dBgPicker" type="color" value="${escapeHtml(d.backgroundColor || "#ffffff")}" style="width:48px; height:42px; padding:0; border-radius:12px;" />
            <input id="dBg" value="${escapeHtml(d.backgroundColor || "")}" placeholder="#FFFFFF" />
          </div>
        </div>
        <div class="field">
          <label>Surface</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input id="dSurfacePicker" type="color" value="${escapeHtml(d.surfaceColor || "#f5f5f5")}" style="width:48px; height:42px; padding:0; border-radius:12px;" />
            <input id="dSurface" value="${escapeHtml(d.surfaceColor || "")}" placeholder="#F5F5F5" />
          </div>
        </div>
        <div class="field">
          <label>Texte</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input id="dTextPicker" type="color" value="${escapeHtml(d.textColor || "#222222")}" style="width:48px; height:42px; padding:0; border-radius:12px;" />
            <input id="dText" value="${escapeHtml(d.textColor || "")}" placeholder="#222222" />
          </div>
        </div>
        <div class="field full">
          <label>Font</label>
          <select id="dFont">
            <option value="Poppins" ${d.fontFamily === "Poppins" ? "selected" : ""}>Poppins</option>
            <option value="Inter" ${d.fontFamily === "Inter" ? "selected" : ""}>Inter</option>
          </select>
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveDesign">Enregistrer</button>
          <p class="hint" id="designHint"></p>
        </div>
      </div>
    `,
    ),
  );

  function isHexColor(value) {
    return /^#([0-9a-fA-F]{6})$/.test(value);
  }

  function syncColor(textId, pickerId) {
    const text = qs(textId);
    const picker = qs(pickerId);
    if (!text || !picker) return;

    picker.addEventListener("input", () => {
      text.value = picker.value;
    });

    text.addEventListener("input", () => {
      const v = text.value.trim();
      if (isHexColor(v)) picker.value = v;
    });
  }

  syncColor("#dAccent", "#dAccentPicker");
  syncColor("#dBg", "#dBgPicker");
  syncColor("#dSurface", "#dSurfacePicker");
  syncColor("#dText", "#dTextPicker");

  qs("#saveDesign").addEventListener("click", async () => {
    const hint = qs("#designHint");
    hint.textContent = "Enregistrement…";
    try {
      await saveSettings({
        design: {
          accentColor: qs("#dAccent").value,
          backgroundColor: qs("#dBg").value,
          surfaceColor: qs("#dSurface").value,
          textColor: qs("#dText").value,
          fontFamily: qs("#dFont").value,
        },
      });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function sectionLabel(key) {
  const map = {
    hero: "Hero",
    about: "À propos",
    services: "Services",
    destinations: "Destinations",
    newsletter: "Newsletter",
    testimonials: "Témoignages",
    contact: "Contact",
  };
  return map[key] || key;
}

function renderLayout() {
  setTitle("Layout");
  const p = page();
  const s = state.settings;
  const order = Array.isArray(s?.layout?.sectionOrder) ? s.layout.sectionOrder : [];
  const enabledRaw = s?.layout?.sectionEnabled || {};
  const enabled = typeof enabledRaw.get === "function" ? Object.fromEntries(enabledRaw) : enabledRaw;

  p.innerHTML = "";

  const itemsHtml = order
    .map(
      (key) => `
      <li class="layout-li" data-key="${escapeHtml(key)}">
        <div style="display:flex; flex-direction:column; gap:2px">
          <strong style="font-size:12px">${escapeHtml(sectionLabel(key))}</strong>
          <span class="muted">Section</span>
        </div>
        <label class="toggle">
          <input type="checkbox" data-toggle="${escapeHtml(key)}" ${enabled[key] === false ? "" : "checked"} />
          Activée
        </label>
      </li>
    `,
    )
    .join("");

  p.appendChild(
    card(
      "Ordre & activation",
      `
      <div class="row">
        <div class="field full">
          <ul class="layout-list" id="layoutList">${itemsHtml}</ul>
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="button" id="saveLayout">Enregistrer</button>
          <p class="hint" id="layoutHint"></p>
        </div>
      </div>
    `,
    ),
  );

  const list = qs("#layoutList");
  new Sortable(list, { animation: 150 });

  qs("#saveLayout").addEventListener("click", async () => {
    const hint = qs("#layoutHint");
    hint.textContent = "Enregistrement…";
    try {
      const nextOrder = qsa(".layout-li", list).map((li) => li.getAttribute("data-key"));
      const nextEnabled = {};
      qsa("[data-toggle]").forEach((cb) => {
        nextEnabled[cb.getAttribute("data-toggle")] = cb.checked;
      });
      await saveSettings({ layout: { sectionOrder: nextOrder, sectionEnabled: nextEnabled } });
      hint.textContent = "Enregistré.";
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderMedia() {
  setTitle("Médias");
  const p = page();
  const s = state.settings;
  p.innerHTML = "";

  p.appendChild(
    card(
      "Logo",
      `
      <div class="row">
        <div class="field">
          <label>Nom</label>
          <input id="brandName" value="${escapeHtml(s?.brand?.name || "")}" />
        </div>
        <div class="field">
          <label>Logo (upload)</label>
          <input id="logoFile" type="file" accept="image/*" />
        </div>
        <div class="field">
          <label>Dossier Cloudinary</label>
          <input id="logoFolder" value="nounou/brand" />
        </div>
        <div class="field">
          <button class="btn btn-primary" type="button" id="saveBrand">Enregistrer</button>
          <p class="hint" id="brandHint"></p>
        </div>
        <div class="field full">
          <div class="item">
            <div style="display:flex; align-items:center; gap:10px; min-width:0">
              <img class="thumb" src="${escapeHtml(s?.brand?.logo?.url || "")}" alt="" />
              <div style="min-width:0">
                <strong>Logo actuel</strong>
                <span style="word-break:break-all">${escapeHtml(s?.brand?.logo?.url || "")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    ),
  );

  qs("#saveBrand").addEventListener("click", async () => {
    const hint = qs("#brandHint");
    hint.textContent = "Enregistrement…";
    try {
      let logo = s?.brand?.logo || {};
      const file = qs("#logoFile").files?.[0];
      if (file) {
        const uploaded = await uploadFile(file, qs("#logoFolder").value || "nounou/brand");
        logo = { url: uploaded.url, publicId: uploaded.publicId };
      }
      await saveSettings({ brand: { name: qs("#brandName").value, logo } });
      hint.textContent = "Enregistré.";
      renderShell();
      renderMedia();
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  });
}

function renderCrud(sectionKey, title, items, fields, apiBase, options = {}) {
  setTitle(title);
  const p = page();
  p.innerHTML = "";

  const listHtml = items
    .map(
      (it) => `
      <div class="item" data-id="${escapeHtml(it._id)}">
        <div style="display:flex; align-items:center; gap:10px; min-width:0">
          <img class="thumb" src="${escapeHtml(it?.media?.url || it?.avatar?.url || "")}" alt="" />
          <div style="min-width:0">
            <strong>${escapeHtml(it.title || it.name || "")}</strong>
            <span>${escapeHtml(it.description || it.location || it.role || "")}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost" type="button" data-edit="${escapeHtml(it._id)}">Éditer</button>
          <button class="btn btn-ghost" type="button" data-del="${escapeHtml(it._id)}">Supprimer</button>
        </div>
      </div>
    `,
    )
    .join("");

  const formFieldsHtml = fields
    .map((f) => {
      const isTextArea = f.type === "textarea";
      const isFile = f.type === "file";
      const full = f.full ? " full" : "";
      const third = f.third ? " third" : "";
      if (isTextArea) {
        return `<div class="field${full}${third}"><label>${escapeHtml(f.label)}</label><textarea id="${escapeHtml(
          f.id,
        )}"></textarea></div>`;
      }
      if (isFile) {
        return `<div class="field${full}${third}"><label>${escapeHtml(f.label)}</label><input id="${escapeHtml(
          f.id,
        )}" type="file" accept="image/*" /></div>`;
      }
      if (f.type === "checkbox") {
        return `<div class="field${full}${third}"><label class="toggle"><input id="${escapeHtml(
          f.id,
        )}" type="checkbox" checked /> ${escapeHtml(f.label)}</label></div>`;
      }
      return `<div class="field${full}${third}"><label>${escapeHtml(f.label)}</label><input id="${escapeHtml(
        f.id,
      )}" placeholder="${escapeHtml(f.placeholder || "")}" /></div>`;
    })
    .join("");

  p.appendChild(
    card(
      `Gestion — ${title}`,
      `
      <div class="row">
        <div class="field full" style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost" type="button" id="crudNew">Nouveau</button>
          ${
            options.bulkCreate
              ? `<button class="btn btn-ghost" type="button" id="crudBulkToggle">Ajouter plusieurs</button>`
              : ""
          }
        </div>
        ${
          options.bulkCreate
            ? `
          <div class="field full" id="crudBulk" style="display:none;">
            <label>Format (1 service par ligne)</label>
            <textarea id="bulkText" placeholder="Titre | Description | https://image.url"></textarea>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
              <button class="btn btn-primary" type="button" id="bulkCreateBtn">Créer</button>
              <button class="btn btn-ghost" type="button" id="bulkFillBtn">Exemple</button>
            </div>
            <p class="hint" id="bulkHint"></p>
          </div>
        `
            : ""
        }
        ${formFieldsHtml}
        <div class="field third">
          <label>Dossier média</label>
          <input id="crudFolder" value="nounou/${escapeHtml(sectionKey)}" />
        </div>
        <div class="field third">
          <button class="btn btn-primary" type="button" id="crudSave">Enregistrer</button>
          <p class="hint" id="crudHint"></p>
        </div>
        <div class="field full"><div class="divider"></div></div>
        <div class="field full">
          <div class="list" id="crudList">${listHtml || `<div class="muted">Aucun élément.</div>`}</div>
        </div>
      </div>
    `,
    ),
  );

  const hint = qs("#crudHint");
  let editingId = null;

  function clearForm() {
    editingId = null;
    fields.forEach((f) => {
      const el = qs(`#${f.id}`);
      if (!el) return;
      if (f.type === "checkbox") el.checked = true;
      else if (f.type === "file") el.value = "";
      else el.value = "";
    });
  }

  async function refresh() {
    await loadAll();
    renderShell();
    renderSection();
  }

  async function onSave() {
    hint.textContent = "Enregistrement…";
    try {
      const payload = {};
      let mediaUrl = null;
      let avatarUrl = null;
      for (const f of fields) {
        const el = qs(`#${f.id}`);
        if (!el) continue;
        if (f.type === "checkbox") payload[f.key] = el.checked;
        else if (f.type === "file") continue;
        else if (f.key === "mediaUrl") mediaUrl = el.value.trim();
        else if (f.key === "avatarUrl") avatarUrl = el.value.trim();
        else if (f.key === "tags") payload[f.key] = el.value ? el.value.split(",").map((t) => t.trim()).filter(Boolean) : [];
        else payload[f.key] = el.value;
      }

      if (mediaUrl) payload.media = { url: mediaUrl };
      if (avatarUrl) payload.avatar = { url: avatarUrl };

      const fileField = fields.find((f) => f.type === "file");
      if (fileField) {
        const file = qs(`#${fileField.id}`).files?.[0];
        if (file) {
          const uploaded = await uploadFile(file, qs("#crudFolder").value || `nounou/${sectionKey}`);
          if (sectionKey === "testimonials") payload.avatar = { url: uploaded.url, publicId: uploaded.publicId };
          else payload.media = { url: uploaded.url, publicId: uploaded.publicId };
        }
      }

      if (editingId) {
        await apiFetch(`${apiBase}/${editingId}`, { method: "PUT", json: payload });
      } else {
        await apiFetch(apiBase, { method: "POST", json: payload });
      }

      hint.textContent = "Enregistré.";
      clearForm();
      await refresh();
    } catch (e) {
      hint.textContent = e.message || "Erreur";
    }
  }

  qs("#crudSave").addEventListener("click", onSave);

  qs("#crudNew").addEventListener("click", () => {
    clearForm();
    hint.textContent = "";
  });

  if (options.bulkCreate) {
    const bulk = qs("#crudBulk");
    const toggle = qs("#crudBulkToggle");
    const bulkText = qs("#bulkText");
    const bulkHint = qs("#bulkHint");

    toggle.addEventListener("click", () => {
      const isOpen = bulk.style.display !== "none";
      bulk.style.display = isOpen ? "none" : "block";
    });

    qs("#bulkFillBtn").addEventListener("click", () => {
      bulkText.value = [
        "Premium Planning | Itinéraires sur-mesure et réservation premium. | https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
        "Local Experiences | Expériences authentiques sélectionnées avec soin. | https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      ].join("\n");
    });

    qs("#bulkCreateBtn").addEventListener("click", async () => {
      bulkHint.textContent = "Création…";
      try {
        const lines = bulkText.value
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const created = [];
        for (const line of lines) {
          const parts = line.split("|").map((p) => p.trim());
          const title = parts[0] || "";
          const description = parts[1] || "";
          const url = parts[2] || "";
          if (!title || !description) continue;

          const json = { title, description, enabled: true };
          if (url) json.media = { url };
          const res = await apiFetch(apiBase, { method: "POST", json });
          created.push(res?.item);
        }

        bulkHint.textContent = `Créés: ${created.length}`;
        bulkText.value = "";
        await refresh();
      } catch (e) {
        bulkHint.textContent = e.message || "Erreur";
      }
    });
  }

  qsa("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Supprimer ?")) return;
      try {
        await apiFetch(`${apiBase}/${id}`, { method: "DELETE" });
        await refresh();
      } catch (e) {
        alert(e.message || "Erreur");
      }
    });
  });

  qsa("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const item = items.find((x) => x._id === id);
      if (!item) return;
      editingId = id;
      fields.forEach((f) => {
        const el = qs(`#${f.id}`);
        if (!el) return;
        if (f.type === "checkbox") el.checked = item[f.key] !== false;
        else if (f.type === "file") el.value = "";
        else if (f.key === "mediaUrl") el.value = item?.media?.url || "";
        else if (f.key === "avatarUrl") el.value = item?.avatar?.url || "";
        else if (f.key === "tags") el.value = (item.tags || []).join(", ");
        else el.value = item[f.key] || "";
      });
      hint.textContent = `Édition: ${item.title || item.name || ""}`;
      const first = qs(`#${fields[0]?.id}`);
      if (first && typeof first.focus === "function") first.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  qsa(".item[data-id]").forEach((row) => {
    row.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.getAttribute) {
        if (target.getAttribute("data-del") || target.getAttribute("data-edit")) return;
      }
      const id = row.getAttribute("data-id");
      const editBtn = qs(`[data-edit="${id}"]`, row);
      if (editBtn) editBtn.click();
    });
  });
}

function renderServices() {
  renderCrud(
    "services",
    "Services",
    state.services,
    [
      { id: "srvTitle", key: "title", label: "Titre" },
      { id: "srvDesc", key: "description", label: "Description", type: "textarea", full: true },
      { id: "srvMediaUrl", key: "mediaUrl", label: "Image URL", full: true, placeholder: "https://..." },
      { id: "srvMedia", key: "media", label: "Image (upload)", type: "file" },
      { id: "srvEnabled", key: "enabled", label: "Activé", type: "checkbox" },
    ],
    "/api/admin/services",
    { bulkCreate: true },
  );
}

function renderOtherServices() {
  renderCrud(
    "other-services",
    "Autres services",
    state.otherServices,
    [
      { id: "osTitle", key: "title", label: "Titre" },
      { id: "osDesc", key: "description", label: "Description", type: "textarea", full: true },
      { id: "osMediaUrl", key: "mediaUrl", label: "Image URL", full: true, placeholder: "https://..." },
      { id: "osMedia", key: "media", label: "Image (upload)", type: "file" },
      { id: "osEnabled", key: "enabled", label: "Activé", type: "checkbox" },
    ],
    "/api/admin/other-services",
    { bulkCreate: true },
  );
}

function renderTestimonials() {
  renderCrud(
    "testimonials",
    "Témoignages",
    state.testimonials,
    [
      { id: "tName", key: "name", label: "Nom" },
      { id: "tRole", key: "role", label: "Rôle" },
      { id: "tQuote", key: "quote", label: "Avis", type: "textarea", full: true },
      { id: "tAvatarUrl", key: "avatarUrl", label: "Avatar URL", full: true, placeholder: "https://..." },
      { id: "tAvatar", key: "avatar", label: "Avatar (upload)", type: "file" },
      { id: "tEnabled", key: "enabled", label: "Activé", type: "checkbox" },
    ],
    "/api/admin/testimonials",
  );
}

function renderSection() {
  const section = state.section;
  const map = {
    settings: renderOverview,
    hero: renderHero,
    about: renderAbout,
    content: renderContent,
    navigation: renderNavigation,
    social: renderSocial,
    services: renderServices,
    "other-services": renderOtherServices,
    testimonials: renderTestimonials,
    design: renderDesign,
    layout: renderLayout,
    contact: renderContact,
    media: renderMedia,
  };
  const fn = map[section] || renderOverview;
  fn();
}

async function route() {
  const hash = location.hash || "#/login";
  const parts = hash.replace(/^#\//, "").split("/");

  const isLoggedIn = Boolean(tokenGet());
  if (!isLoggedIn && parts[0] !== "login") {
    location.hash = "#/login";
    return;
  }

  if (parts[0] === "login") {
    renderLogin();
    return;
  }

  state.section = parts[1] || "settings";
  await loadAll();
  renderShell();
  renderSection();
}

window.addEventListener("hashchange", () => {
  route().catch(() => {});
});

route().catch(() => {
  location.hash = "#/login";
});

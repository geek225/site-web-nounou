const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { defaultData } = require("./defaultData");

const filePath = path.join(process.cwd(), "local-db.json");

function normalizeItem(item) {
  if (!item) return item;
  const id = item.id || item._id || crypto.randomUUID();
  return { ...item, id, _id: id };
}

function normalizeCollection(items) {
  return (items || []).map(normalizeItem);
}

function normalizeState(state) {
  const s = state || {};
  return {
    settings: deepMerge(defaultData.settings, s.settings || {}),
    services: normalizeCollection(s.services || defaultData.services),
    serviceRequests: normalizeCollection(s.serviceRequests || defaultData.serviceRequests || []),
    otherServices: normalizeCollection(s.otherServices || defaultData.otherServices || []),
    destinations: normalizeCollection(s.destinations || defaultData.destinations),
    testimonials: normalizeCollection(s.testimonials || defaultData.testimonials),
  };
}

async function readState() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch {
    return normalizeState(null);
  }
}

async function writeState(state) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  if (!base || typeof base !== "object") return structuredClone(patch);
  if (Array.isArray(base) || Array.isArray(patch)) return structuredClone(patch);

  const out = { ...base };
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined) return;
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
      return;
    }
    out[k] = structuredClone(v);
  });
  return out;
}

async function ensureLocalData() {
  let exists = true;
  try {
    await fs.access(filePath);
  } catch {
    exists = false;
  }

  const state = await readState();
  let changed = !exists;

  const currentImages = state?.settings?.hero?.sliderImages;
  const defaultImages = defaultData?.settings?.hero?.sliderImages || [];
  const currentRoundImages = state?.settings?.hero?.roundSliderImages;
  const defaultRoundImages = defaultData?.settings?.hero?.roundSliderImages || [];

  if (!Array.isArray(currentImages)) {
    state.settings.hero.sliderImages = defaultImages.slice(0, 4);
    changed = true;
  } else if (currentImages.length < 4 && defaultImages.length >= 4) {
    state.settings.hero.sliderImages = [...currentImages, ...defaultImages.slice(currentImages.length, 4)];
    changed = true;
  }

  if (!Array.isArray(currentRoundImages)) {
    const fallback = state.settings.hero.sliderImages || defaultImages;
    const base = defaultRoundImages.length ? defaultRoundImages : fallback;
    state.settings.hero.roundSliderImages = base.slice(0, 4);
    changed = true;
  } else if (currentRoundImages.length < 4 && defaultRoundImages.length >= 4) {
    state.settings.hero.roundSliderImages = [
      ...currentRoundImages,
      ...defaultRoundImages.slice(currentRoundImages.length, 4),
    ];
    changed = true;
  }

  if (changed) await writeState(state);
}

async function getBootstrap() {
  const state = await readState();
  return {
    settings: state.settings,
    services: state.services.filter((s) => s.enabled !== false).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    otherServices: (state.otherServices || [])
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    destinations: state.destinations
      .filter((d) => d.enabled !== false)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    testimonials: state.testimonials
      .filter((t) => t.enabled !== false)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  };
}

async function getSettings() {
  const state = await readState();
  return state.settings;
}

async function updateSettings(patch) {
  const state = await readState();
  state.settings = deepMerge(state.settings, patch);
  await writeState(state);
  return state.settings;
}

async function listCollection(name) {
  const state = await readState();
  return (state[name] || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

async function createInCollection(name, payload) {
  const state = await readState();
  const item = normalizeItem({
    ...payload,
    enabled: payload.enabled ?? true,
    order_index: payload.order_index ?? payload.order ?? 0,
  });
  state[name] = [...(state[name] || []), item];
  await writeState(state);
  return item;
}

async function updateInCollection(name, id, patch) {
  const state = await readState();
  const items = state[name] || [];
  const idx = items.findIndex((x) => x.id === id || x._id === id);
  if (idx === -1) return null;
  const next = { ...items[idx], ...patch };
  if (patch.order !== undefined) next.order_index = patch.order;
  state[name] = items.map((x, i) => (i === idx ? normalizeItem(next) : x));
  await writeState(state);
  return state[name][idx];
}

async function deleteFromCollection(name, id) {
  const state = await readState();
  state[name] = (state[name] || []).filter((x) => x.id !== id && x._id !== id);
  await writeState(state);
}

module.exports = {
  ensureLocalData,
  getBootstrap,
  getSettings,
  updateSettings,
  listCollection,
  createInCollection,
  updateInCollection,
  deleteFromCollection,
};

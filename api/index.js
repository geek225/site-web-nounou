const app = require("../src/app");
const { ensureInitialData } = require("../src/seed/ensureInitialData");

let seeded = false;
async function seedOnce() {
  if (seeded) return;
  seeded = true;
  try {
    await ensureInitialData();
  } catch (e) {
    const msg = e?.message || e;
    console.warn("Seed failed.", msg);
  }
}

seedOnce();

const handler = (req, res) => app(req, res);

module.exports = handler;
module.exports.default = handler;


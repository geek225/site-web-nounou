const { app } = require("../src/app");
const { ensureInitialData } = require("../src/seed/ensureInitialData");

let seeded = false;
async function seedOnce() {
  if (seeded) return;
  seeded = true;
  try {
    await ensureInitialData();
  } catch {
  }
}

seedOnce();

module.exports = app;


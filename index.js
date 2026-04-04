const http = require("node:http");

const { app } = require("./src/app");
const { env } = require("./src/config/env");
const { ensureInitialData } = require("./src/seed/ensureInitialData");

function listenWithFallback(server, preferredPort, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryListen(port) {
      server.once("error", (err) => {
        if (err && err.code === "EADDRINUSE" && attempt < maxAttempts) {
          attempt += 1;
          tryListen(port + 1);
          return;
        }
        reject(err);
      });

      server.listen(port, () => resolve(port));
    }

    tryListen(preferredPort);
  });
}

async function start() {
  const server = http.createServer(app);

  const port = await listenWithFallback(server, env.PORT);
  console.log(`Server running on http://localhost:${port}`);

  ensureInitialData().catch((error) => {
    console.warn("Seed failed.");
    console.warn(error?.message || error);
  });
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


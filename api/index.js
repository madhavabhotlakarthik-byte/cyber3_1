import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const possiblePaths = [
  join(__dirname, "dist", "server", "server.js"),
  join(__dirname, "server.js"),
  join(__dirname, "..", "dist", "server", "server.js"),
];

let handler;
let loadPath;
for (const p of possiblePaths) {
  try {
    const mod = require(p);
    handler = mod.default || mod;
    loadPath = p;
    console.log("[api/index.js] Loaded from:", p, "typeof:", typeof handler);
    break;
  } catch (err) {
    console.log("[api/index.js] Not found at:", p);
  }
}

if (!handler) {
  console.error("[api/index.js] Could not load server bundle from any path");
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async (req, res) => {
  if (!handler) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Server bundle not available — check Vercel function logs for path errors");
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) headers.set(k, v);
    }

    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await collectBody(req);
    }

    const webReq = new Request(url, { method: req.method, headers, body });
    const webRes = await handler.fetch(webReq, {}, {});

    res.statusCode = webRes.status;
    webRes.headers.forEach((v, k) => res.setHeader(k, v));

    if (webRes.body) {
      const reader = webRes.body.getReader();
      const pump = () =>
        reader.read().then(({ done, value }) => {
          if (done) { res.end(); return; }
          res.write(value);
          return pump();
        });
      await pump();
    } else {
      res.end();
    }
  } catch (err) {
    console.error("[api/index.js] SSR error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end("Internal Server Error");
    }
  }
};

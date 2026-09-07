import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

let handler;
try {
  const mod = require("../dist/server/server.js");
  handler = mod.default || mod;
  console.log("[api/index.js] Loaded handler:", typeof handler);
} catch (err) {
  console.error("[api/index.js] Failed to load server bundle:", err);
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
    res.end("Server bundle not available");
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

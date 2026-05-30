const http = require("http");
const fs = require("fs");
const path = require("path");
const { runCbnAi } = require("./lib/cbn-ai-core");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function healthPayload(runtime) {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  return {
    ok: true,
    runtime,
    hasOpenAiKey,
    setupRequired: !hasOpenAiKey,
    message: hasOpenAiKey
      ? "AI article search is configured."
      : "AI setup needed: add OPENAI_API_KEY in the exact Vercel project, enable it for this environment, then redeploy."
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleArticleChat(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, { error: "Invalid request", message: "The request body could not be read as JSON." });
    return;
  }

  const mode = payload.mode === "plan" ? "plan" : "article";
  try {
    const result = await runCbnAi(
      Object.assign({}, payload, {
        mode: mode === "plan" ? "plan" : "article_search"
      })
    );
    sendJson(res, result.status, result.payload);
    return;
  } catch (error) {
    sendJson(res, 500, {
      error: "Network or server failure",
      message: error.message || "The article finder could not reach OpenAI."
    });
  }
}

async function handleCbnAi(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, { error: "Invalid request", message: "The request body could not be read as JSON." });
    return;
  }

  try {
    const result = await runCbnAi(payload);
    sendJson(res, result.status, result.payload);
  } catch (error) {
    sendJson(res, 500, {
      error: "Network or server failure",
      message: error.message || "The AI coach could not complete the request."
    });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/article-chat") {
    handleArticleChat(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/cbn-ai") {
    handleCbnAi(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, healthPayload("local-node"));
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`CBN Planning Coach running at http://localhost:${PORT}/`);
});

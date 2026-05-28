const http = require("http");
const fs = require("fs");
const path = require("path");

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

function extractOutputText(responseJson) {
  if (responseJson.output_text) return responseJson.output_text;
  const chunks = [];
  for (const item of responseJson.output || []) {
    if (item.type === "message") {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) chunks.push(content.text);
        if (content.type === "text" && content.text) chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function parseModelJson(text) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const candidate = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  return JSON.parse(candidate);
}

function buildSystemPrompt(mode) {
  const shared =
    "You are a careful high school Current Business News planning coach. Keep the student objective, cite sources, avoid invented links, and prioritize credible journalism. The project needs seven slides: article info, summary, background/context, implications for US economy/policy/global/classmates, business class concept, 2-3 discussion questions, and MLA works cited. Quantitative evidence beyond a stock chart is required.";

  if (mode === "plan") {
    return `${shared}

Return JSON only with this shape:
{
  "assistantMessage": "short encouraging planning note",
  "themeIdeas": [{"title":"string","reason":"string"}],
  "outline": [{"slide":"1","title":"string","studentWork":"string","aiStarter":"string"}],
  "visualIdeas": ["string"],
  "discussionQuestions": ["string"],
  "warnings": ["string"]
}

Make it clear the AI is giving a scaffold and the student must write, verify, design, cite, and rehearse the final deck.`;
  }

  return `${shared}

Use web search to find current, credible business-news articles that match the student's survey and chat. Ask follow-up questions if the interests are too broad or if the student has not given enough direction. Otherwise return 5-10 article options.

Return JSON only with this shape:
{
  "assistantMessage": "short conversational response",
  "needsMoreInfo": false,
  "followUpQuestions": ["string"],
  "articles": [{
    "id": "short-stable-id",
    "title": "string",
    "outlet": "string",
    "date": "string",
    "url": "https://...",
    "summary": "2 sentence neutral summary",
    "businessRelevance": "why this works for the assignment",
    "themePotential": "a possible deck theme",
    "dataIdeas": ["string"],
    "citationNote": "what to verify for MLA"
  }]
}

Every article must include a working URL. Prefer Reuters, AP, CNBC, WSJ, NYT, Washington Post, Bloomberg, The Economist, NPR, Marketplace, official company context only as support, and other credible mainstream outlets. Do not use social media as the main source.`;
}

async function handleArticleChat(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 503, {
      setupRequired: true,
      error: "Missing OPENAI_API_KEY",
      message: "AI setup needed: add OPENAI_API_KEY in the exact Vercel project, enable it for Production and Preview, then redeploy."
    });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, { error: "Invalid request", message: "The request body could not be read as JSON." });
    return;
  }

  const mode = payload.mode === "plan" ? "plan" : "article";
  const survey = payload.survey || {};
  const selectedArticles = payload.selectedArticles || [];
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-10) : [];

  const input = JSON.stringify(
    {
      mode,
      survey,
      selectedArticles,
      conversation: messages
    },
    null,
    2
  );

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions: buildSystemPrompt(mode),
        reasoning: { effort: "low" },
        tools: [{ type: "web_search" }],
        tool_choice: mode === "article" ? "auto" : undefined,
        include: ["web_search_call.action.sources"],
        input
      })
    });

    const responseJson = await openAiResponse.json();
    if (!openAiResponse.ok) {
      sendJson(res, openAiResponse.status, {
        error: "OpenAI request failed",
        message: responseJson.error && responseJson.error.message ? responseJson.error.message : "OpenAI returned an error."
      });
      return;
    }

    const text = extractOutputText(responseJson);
    let parsed;
    try {
      parsed = parseModelJson(text);
    } catch (error) {
      sendJson(res, 502, {
        error: "Invalid AI response",
        message: "The AI answered, but not in the structured format this app expected.",
        raw: text
      });
      return;
    }

    sendJson(res, 200, parsed);
  } catch (error) {
    sendJson(res, 500, {
      error: "Network or server failure",
      message: error.message || "The article finder could not reach OpenAI."
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

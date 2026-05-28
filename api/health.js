function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  sendJson(res, 200, {
    ok: true,
    runtime: "vercel",
    hasOpenAiKey,
    setupRequired: !hasOpenAiKey,
    message: hasOpenAiKey
      ? "AI article search is configured."
      : "AI setup needed: add OPENAI_API_KEY in the exact Vercel project, enable it for this environment, then redeploy."
  });
};

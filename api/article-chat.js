const { runCbnAi } = require("../lib/cbn-ai-core");

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (error) {
    sendJson(res, 400, { error: "Invalid request", message: "The request body could not be read as JSON." });
    return;
  }

  try {
    const result = await runCbnAi(
      Object.assign({}, payload, {
        mode: payload.mode === "plan" ? "plan" : "article_search"
      })
    );
    sendJson(res, result.status, result.payload);
  } catch (error) {
    sendJson(res, 500, {
      error: "Network or server failure",
      message: error.message || "The article finder could not reach OpenAI."
    });
  }
};

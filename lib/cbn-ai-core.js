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

function articleSearchFallback(text) {
  const message = String(text || "").trim();
  return {
    assistantMessage: message
      ? "The AI searched, but its answer came back as plain text. Try the search again or add one specific company, industry, or trend."
      : "The AI did not return usable article cards. Add a more specific topic and try again.",
    needsMoreInfo: true,
    followUpQuestions: [
      "What company, industry, product, sport, creator, or trend do you actually want to present?",
      "Do you want the story to be more about money, marketing, technology, ethics, or competition?"
    ],
    articles: [],
    rawNote: message.slice(0, 1200)
  };
}

function normalizeArticlePayload(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  const articles = Array.isArray(parsed.articles) ? parsed.articles : [];
  return Object.assign({}, parsed, {
    needsMoreInfo: Boolean(parsed.needsMoreInfo) && articles.length === 0,
    followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
    articles: articles
      .filter(function (article) {
        return article && (article.title || article.url || article.summary);
      })
      .map(function (article, index) {
        const title = article.title || article.url || "Article option " + (index + 1);
        return Object.assign(
          {
            id: article.id || article.url || title,
            title: title,
            outlet: article.outlet || "Source",
            date: article.date || "Verify date",
            url: article.url || "#",
            summary: article.summary || "",
            businessRelevance: article.businessRelevance || "Check how this connects to a business decision, market impact, or class concept.",
            themePotential: article.themePotential || "Use this as a focused business-news story.",
            dataIdeas: Array.isArray(article.dataIdeas) ? article.dataIdeas : [],
            citationNote: article.citationNote || "Verify author, publication, date, title, and URL for MLA."
          },
          article
        );
      })
  });
}

function setupError() {
  return {
    status: 503,
    payload: {
      setupRequired: true,
      error: "Missing OPENAI_API_KEY",
      message: "AI setup needed: add OPENAI_API_KEY in the exact Vercel project, enable it for Production and Preview, then redeploy."
    }
  };
}

function baseRules() {
  return [
    "You are a direct, thoughtful high school Current Business News project coach.",
    "Be honest without being cruel. If an idea is weak, say why and offer stronger replacements.",
    "The assignment needs seven slides: article info, summary, background/context, implications for US economy/policy/global/classmates, class concept, 2-3 discussion questions, MLA works cited.",
    "Require credible journalism, objective framing, quantitative evidence beyond a stock chart, strong visual design, rehearsal, and citations.",
    "Return JSON only. Do not wrap JSON in markdown."
  ].join(" ");
}

function promptForMode(mode) {
  if (mode === "article_search") {
    return `${baseRules()}
Use web search to find current, credible business-news articles. Ask follow-up questions if needed, otherwise return 5-10 article options.
Shape:
{"assistantMessage":"string","needsMoreInfo":false,"followUpQuestions":["string"],"articles":[{"id":"short-id","title":"string","outlet":"string","date":"string","url":"https://...","summary":"2 sentences","businessRelevance":"string","themePotential":"string","dataIdeas":["string"],"citationNote":"string"}]}`;
  }

  if (mode === "plan") {
    return `${baseRules()}
Create a presentation direction from selected articles plus the student's desired vibe. Make the student do the work; provide a scaffold, not a finished project.
Shape:
{"assistantMessage":"string","themeIdeas":[{"title":"string","reason":"string","visualStyle":"string"}],"outline":[{"slide":"1","title":"string","studentWork":"string","aiStarter":"string","visualDirection":"string"}],"dataIdeas":["string"],"classConnections":["string"],"discussionQuestions":["string"],"presentationMoves":["string"],"warnings":["string"]}`;
  }

  if (mode === "feedback") {
    return `${baseRules()}
Critique the student's idea, class connection, slide text, vibe, hook, or visual plan. Be specific and practical.
Shape:
{"assistantMessage":"string","verdict":"strong|workable|weak","whatWorks":["string"],"problems":["string"],"betterOptions":["string"],"rewrite":"string","nextStep":"string"}`;
  }

  if (mode === "deck_grade") {
    return `${baseRules()}
Grade the uploaded CBN deck PDF. Focus on formatting, wording, visuals, slide completeness, evidence, MLA/citations, class connection, discussion questions, and presentation polish. Do not invent details not visible in the PDF.
Shape:
{"assistantMessage":"string","scoreEstimate":"string","topFixes":["string"],"formatting":["string"],"wording":["string"],"visuals":["string"],"rubricGaps":["string"],"slideNotes":[{"slide":"string","feedback":"string"}],"presentationAdvice":["string"],"nextStep":"string"}`;
  }

  return `${baseRules()} Shape: {"assistantMessage":"Unsupported mode.","error":"Unsupported mode"}`;
}

function buildInput(mode, payload) {
  const contextText = JSON.stringify(
    {
      mode,
      survey: payload.survey || {},
      selectedArticles: payload.selectedArticles || [],
      vibe: payload.vibe || {},
      conversation: Array.isArray(payload.messages) ? payload.messages.slice(-12) : [],
      userText: payload.userText || "",
      planDraft: payload.planDraft || {}
    },
    null,
    2
  );

  if (mode === "deck_grade" && payload.fileData) {
    return [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: payload.filename || "cbn-deck.pdf",
            file_data: payload.fileData.startsWith("data:")
              ? payload.fileData
              : `data:application/pdf;base64,${payload.fileData}`
          },
          {
            type: "input_text",
            text: "Grade this CBN presentation PDF using the official CBN rubric and this context:\n" + contextText
          }
        ]
      }
    ];
  }

  return contextText;
}

async function runCbnAi(payload) {
  if (!process.env.OPENAI_API_KEY) return setupError();

  const mode = payload.mode || "article_search";
  const body = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    instructions: promptForMode(mode),
    reasoning: { effort: mode === "deck_grade" ? "medium" : "low" },
    input: buildInput(mode, payload)
  };

  if (mode === "article_search") {
    body.tools = [{ type: "web_search" }];
    body.tool_choice = "auto";
    body.include = ["web_search_call.action.sources"];
  } else {
    body.text = {
      format: {
        type: "json_object"
      }
    };
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const responseJson = await openAiResponse.json();
  if (!openAiResponse.ok) {
    return {
      status: openAiResponse.status,
      payload: {
        error: "OpenAI request failed",
        message: responseJson.error && responseJson.error.message ? responseJson.error.message : "OpenAI returned an error."
      }
    };
  }

  try {
    const parsed = parseModelJson(extractOutputText(responseJson));
    return { status: 200, payload: mode === "article_search" ? normalizeArticlePayload(parsed) : parsed };
  } catch (error) {
    if (mode === "article_search") {
      return { status: 200, payload: articleSearchFallback(extractOutputText(responseJson)) };
    }
    return {
      status: 502,
      payload: {
        error: "Invalid AI response",
        message: "The AI answered, but not in the structured format this app expected.",
        raw: extractOutputText(responseJson)
      }
    };
  }
}

module.exports = {
  runCbnAi
};

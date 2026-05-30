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

function localPlanFallback(payload, note) {
  const selected = Array.isArray(payload.selectedArticles) ? payload.selectedArticles : [];
  const survey = payload.survey || {};
  const main = selected[0] || {};
  const topic = main.title || survey.interests || "your selected article";
  const theme = main.themePotential || "The business decision behind the headline";

  return {
    assistantMessage: note
      ? "Live AI planning hit a setup issue, so here is a fast backup scaffold. " + note
      : "Here is a fast planning scaffold. Verify facts, write the final slide text yourself, cite sources, and rehearse.",
    studentTasks: [
      "Pick the clearest business decision in the article.",
      "Find one number that proves why the story matters.",
      "Connect the story to one class concept in plain language."
    ],
    themeIdeas: [
      {
        title: theme,
        reason: "This keeps the deck focused on the business choice, not just the headline.",
        visualStyle: "clean headline, one strong data callout, simple stakeholder visuals"
      },
      {
        title: "Who wins, who pays, who changes",
        reason: "This gives you a simple structure for implications and discussion.",
        visualStyle: "comparison chart, impact matrix, restrained colors"
      }
    ],
    outline: [
      {
        slide: "1",
        title: "Article info and hook",
        studentWork: "Confirm title, outlet, author, date, URL, and your one-sentence hook.",
        aiStarter: topic,
        visualDirection: "Big headline plus one image or number."
      },
      {
        slide: "2",
        title: "Neutral summary",
        studentWork: "Explain what happened in your own words without opinion language.",
        aiStarter: "Company or group, decision, timing, and why it matters.",
        visualDirection: "Four short bullets or a timeline."
      },
      {
        slide: "3",
        title: "Background and context",
        studentWork: "Explain the company, market, policy, or trend needed to understand the story.",
        aiStarter: "Give classmates the missing context before the analysis.",
        visualDirection: "Market map, timeline, or stakeholder snapshot."
      },
      {
        slide: "4",
        title: "Implications",
        studentWork: "Cover impact on the US economy, policy, global issues, and classmates where relevant.",
        aiStarter: "Use one data point or comparison for each major implication.",
        visualDirection: "Impact matrix."
      },
      {
        slide: "5",
        title: "Class concept",
        studentWork: "Teach or apply one business concept directly to the article.",
        aiStarter: "Define the concept, then show how the article demonstrates it.",
        visualDirection: "Concept label plus article example."
      },
      {
        slide: "6",
        title: "Discussion questions",
        studentWork: "Write 2-3 questions classmates can debate.",
        aiStarter: "Ask about tradeoffs, incentives, risks, or predictions.",
        visualDirection: "Two-option decision slide."
      },
      {
        slide: "7",
        title: "MLA works cited",
        studentWork: "Cite the main article plus every image, chart, and statistic.",
        aiStarter: "Verify citations manually before turning it in.",
        visualDirection: "Clean text-only citation slide."
      }
    ],
    dataIdeas: [
      "Find a non-stock-chart number from the article or a linked source.",
      "Compare before/after costs, revenue, users, market share, prices, or regulation."
    ],
    classConnections: ["marketing", "competition", "supply and demand", "ethics", "risk and reward"],
    discussionQuestions: [
      "Who benefits most from this decision, and who takes on the most risk?",
      "What data point would most change your opinion about the story?",
      "What should the company, consumers, or regulators do next?"
    ],
    presentationMoves: [
      "Use fewer words on slides than in speaker notes.",
      "Explain the business logic, not just the news event.",
      "Practice the hook and class concept out loud."
    ],
    warnings: ["Do not copy this directly. Verify facts and citations."]
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

function normalizePlanPayload(parsed, payload) {
  const fallback = localPlanFallback(payload);
  if (!parsed || typeof parsed !== "object") return fallback;
  return Object.assign({}, fallback, parsed, {
    themeIdeas: Array.isArray(parsed.themeIdeas) && parsed.themeIdeas.length ? parsed.themeIdeas : fallback.themeIdeas,
    outline: Array.isArray(parsed.outline) && parsed.outline.length ? parsed.outline : fallback.outline,
    studentTasks: Array.isArray(parsed.studentTasks) ? parsed.studentTasks : fallback.studentTasks,
    dataIdeas: Array.isArray(parsed.dataIdeas) ? parsed.dataIdeas : fallback.dataIdeas,
    classConnections: Array.isArray(parsed.classConnections) ? parsed.classConnections : fallback.classConnections,
    discussionQuestions: Array.isArray(parsed.discussionQuestions) ? parsed.discussionQuestions : fallback.discussionQuestions,
    presentationMoves: Array.isArray(parsed.presentationMoves) ? parsed.presentationMoves : fallback.presentationMoves,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : fallback.warnings
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
Use web search to find current, credible business-news articles. Ask follow-up questions if needed, otherwise return 3-5 article options.
Shape:
{"assistantMessage":"string","needsMoreInfo":false,"followUpQuestions":["string"],"articles":[{"id":"short-id","title":"string","outlet":"string","date":"string","url":"https://...","summary":"2 sentences","businessRelevance":"string","themePotential":"string","dataIdeas":["string"],"citationNote":"string"}]}`;
  }

  if (mode === "plan") {
    return `${baseRules()}
Create a concise presentation direction from selected articles plus the student's desired vibe. Make the student do the work; provide a scaffold, not a finished project.
Shape:
{"assistantMessage":"string","studentTasks":["string"],"themeIdeas":[{"title":"string","reason":"string","visualStyle":"string"}],"outline":[{"slide":"1","title":"string","studentWork":"string","aiStarter":"string","visualDirection":"string"}],"dataIdeas":["string"],"classConnections":["string"],"discussionQuestions":["string"],"presentationMoves":["string"],"warnings":["string"]}`;
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

function modelForMode(mode) {
  if (mode === "deck_grade") {
    return process.env.OPENAI_DEEP_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
  }
  return process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
}

function outputLimitForMode(mode) {
  if (mode === "article_search") return 1800;
  if (mode === "plan") return 1200;
  if (mode === "feedback") return 900;
  if (mode === "deck_grade") return 2400;
  return 900;
}

async function postOpenAiResponse(body) {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });
}

async function postOpenAiWithCompatibilityFallback(body) {
  let openAiResponse = await postOpenAiResponse(body);
  let responseJson = await openAiResponse.json();
  if (openAiResponse.ok) return { openAiResponse, responseJson };

  const message = responseJson.error && responseJson.error.message ? responseJson.error.message : "";
  const canSimplifyReasoning = body.reasoning && /reasoning|unsupported parameter|unknown parameter|invalid/i.test(message);
  const canSimplifyFormat = body.text && /text\.format|json|response_format|unsupported parameter|unknown parameter|invalid/i.test(message);

  if (!canSimplifyReasoning && !canSimplifyFormat) return { openAiResponse, responseJson };

  const retryBody = Object.assign({}, body);
  if (canSimplifyReasoning) delete retryBody.reasoning;
  if (canSimplifyFormat) delete retryBody.text;

  openAiResponse = await postOpenAiResponse(retryBody);
  responseJson = await openAiResponse.json();
  return { openAiResponse, responseJson };
}

async function runCbnAi(payload) {
  const mode = payload.mode || "article_search";
  if (!process.env.OPENAI_API_KEY) {
    if (mode === "plan") return { status: 200, payload: localPlanFallback(payload, "The OpenAI key is not configured yet.") };
    return setupError();
  }

  const body = {
    model: modelForMode(mode),
    instructions: promptForMode(mode),
    reasoning: { effort: mode === "deck_grade" ? "medium" : "low" },
    max_output_tokens: outputLimitForMode(mode),
    input: buildInput(mode, payload)
  };

  if (mode === "article_search") {
    body.tools = [{ type: "web_search" }];
    body.tool_choice = "auto";
    body.max_tool_calls = 2;
    body.include = ["web_search_call.action.sources"];
  } else {
    body.text = {
      format: {
        type: "json_object"
      }
    };
  }

  const { openAiResponse, responseJson } = await postOpenAiWithCompatibilityFallback(body);
  if (!openAiResponse.ok) {
    if (mode === "plan") {
      const message = responseJson.error && responseJson.error.message ? responseJson.error.message : "OpenAI returned an error.";
      return { status: 200, payload: localPlanFallback(payload, message) };
    }
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
    if (mode === "article_search") return { status: 200, payload: normalizeArticlePayload(parsed) };
    if (mode === "plan") return { status: 200, payload: normalizePlanPayload(parsed, payload) };
    return { status: 200, payload: parsed };
  } catch (error) {
    if (mode === "article_search") {
      return { status: 200, payload: articleSearchFallback(extractOutputText(responseJson)) };
    }
    if (mode === "plan") {
      return { status: 200, payload: localPlanFallback(payload, "The AI returned an unstructured answer.") };
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

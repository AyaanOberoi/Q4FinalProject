(function (global) {
  const REQUIRED_CHECKBOX_IDS = [
    "title",
    "summary",
    "background",
    "economy",
    "policy",
    "global",
    "students",
    "concept",
    "questions",
    "mla",
    "visuals",
    "presentation"
  ];

  const businessTerms = [
    "economy",
    "economic",
    "regulation",
    "policy",
    "law",
    "fed",
    "global",
    "market",
    "competition",
    "supply",
    "demand",
    "inflation",
    "revenue",
    "profit",
    "consumer",
    "trade",
    "industry",
    "business"
  ];

  const dataTerms = [
    "data",
    "graph",
    "chart",
    "statistic",
    "statistics",
    "percent",
    "%",
    "million",
    "billion",
    "survey",
    "report",
    "study",
    "trend"
  ];

  function countWords(text) {
    return String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function includesAny(text, terms) {
    const lowerText = String(text || "").toLowerCase();
    return terms.some(function (term) {
      return lowerText.includes(term.toLowerCase());
    });
  }

  function gradeLabel(score) {
    if (score >= 90) return "Excellent: this looks presentation-ready.";
    if (score >= 80) return "Strong: a few upgrades could make it excellent.";
    if (score >= 70) return "Solid start: fix the missing requirements next.";
    if (score >= 60) return "Developing: the idea needs more evidence and detail.";
    return "Needs work: use the feedback as a revision checklist.";
  }

  function buildDeckFeedback(score, checkedValues, deckText, extras) {
    const feedback = [];
    const deck = String(deckText || "");
    const missing = REQUIRED_CHECKBOX_IDS.filter(function (id) {
      return checkedValues.indexOf(id) === -1;
    });

    if (missing.length) {
      feedback.push({
        title: "Finish every required part",
        body:
          "You are missing " +
          missing.length +
          " rubric item(s). Cross-check Slide 1–7 and the four implications on Slide 4."
      });
    } else {
      feedback.push({
        title: "Checklist coverage looks complete",
        body: "If your deck truly matches these boxes, rehearse pacing and MLA accuracy next."
      });
    }

    const words = countWords(deck);
    if (words < 80) {
      feedback.push({
        title: "Paste a fuller outline",
        body: "Paste slide titles plus bullets per slide so the scorer can judge depth. Export notes from Google Slides or PowerPoint."
      });
    }

    if (!includesAny(deck, dataTerms) || words < 150) {
      feedback.push({
        title: "Show quantitative evidence in the outline",
        body: 'Mention stats, percentages, survey results, or a non-stock chart. Avoid using only "stock chart" wording.'
      });
    }

    if (!includesAny(deck, businessTerms) && words < 220) {
      feedback.push({
        title: "Add business framing",
        body: 'Use terms like markets, regulation, competition, inflation, consumers, trade, policy, labor, margins, pricing.'
      });
    }

    if (checkedValues.indexOf("students") === -1) {
      feedback.push({
        title: "Why this matters to classmates",
        body: 'Slide 4D should explicitly name student impacts: budgets, careers, entrepreneurship, subscriptions, ethics, futures.'
      });
    }

    if (checkedValues.indexOf("questions") === -1) {
      feedback.push({
        title: "Slide 6 discussion prompts",
        body: 'Write 2–3 open-ended "how/why/if" questions, not yes/no trivia.'
      });
    }

    if (extras.hasSensitiveNote && extras.sensitiveDiscussed !== true) {
      feedback.push({
        title: "Sensitive topics",
        body: 'If triggering, verify you planned with your teacher before finalizing wording.'
      });
    }

    if (score >= 85) {
      feedback.push({
        title: "Polish phase",
        body: 'Tighten visuals, rehearse aloud, cite every graph/source in MLA.'
      });
    }

    return feedback;
  }

  global.ProjectGrader = {
    REQUIRED_CHECKBOX_IDS: REQUIRED_CHECKBOX_IDS,
    businessTerms: businessTerms,
    dataTerms: dataTerms,
    countWords: countWords,
    includesAny: includesAny,
    gradeLabel: gradeLabel,
    buildDeckFeedback: buildDeckFeedback
  };
})(typeof window !== "undefined" ? window : this);

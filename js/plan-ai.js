(function () {
  const selectedWrap = document.getElementById("selectedArticlesForPlan");
  const generateBtn = document.getElementById("generatePlanDraft");
  const planOutput = document.getElementById("planDraftOutput");
  const planStatus = document.getElementById("planStatus");
  const manualForm = document.getElementById("manualPlanForm");
  const copyBtn = document.getElementById("copyPlanDraft");

  if (!selectedWrap || !window.CBNStore) return;

  const survey = CBNStore.getSurvey();
  const selected = CBNStore.getSelectedArticles();

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function renderSelected() {
    selectedWrap.innerHTML = "";
    if (!selected.length) {
      selectedWrap.innerHTML =
        '<p class="muted-hint">No selected articles yet. Visit the article finder, choose your best options, then come back here.</p><a class="button secondary compact" href="article-chat.html">Open article finder</a>';
      return;
    }

    selected.forEach(function (article) {
      const card = document.createElement("article");
      card.className = "selected-article";
      card.innerHTML =
        "<span>" +
        escapeHtml(article.outlet || "Source") +
        "</span><h3>" +
        escapeHtml(article.title || "Untitled article") +
        "</h3><p>" +
        escapeHtml(article.businessRelevance || article.summary || "") +
        "</p>";
      selectedWrap.append(card);
    });
  }

  function localPlanDraft() {
    const main = selected[0] || {};
    const topic = main.title || survey.interests || "your selected article";
    const theme = main.themePotential || "A polished business news story about incentives, tradeoffs, and measurable impact";
    return {
      assistantMessage:
        "This is a planning scaffold. You still need to verify facts, write the slide language, design the visuals, cite sources, and rehearse.",
      themeIdeas: [
        { title: theme, reason: "Use one visual motif across slides so the deck feels intentional." },
        {
          title: "Numbers behind the headline",
          reason: "Make the quantitative evidence visible instead of hiding it in speaker notes."
        }
      ],
      outline: [
        {
          slide: "1",
          title: "Headline slate",
          studentWork: "Confirm title, outlet, author, date, and your name.",
          aiStarter: topic
        },
        {
          slide: "2",
          title: "Neutral summary",
          studentWork: "Explain who did what, when, why it matters, and what is still uncertain.",
          aiStarter: "Use 4-5 concise bullets, not opinion language."
        },
        {
          slide: "3",
          title: "Background/context",
          studentWork: "Give company, industry, or historical context.",
          aiStarter: "Show a timeline, market map, or stakeholder snapshot."
        },
        {
          slide: "4",
          title: "Implication matrix",
          studentWork: "Cover US economy, policy/regulation, global angle, and classmates.",
          aiStarter: "Use a four-quadrant layout with one data point per quadrant."
        },
        {
          slide: "5",
          title: "Business concept",
          studentWork: "Connect to class or teach a new concept clearly.",
          aiStarter: "Define the concept, then apply it directly to the article."
        },
        {
          slide: "6",
          title: "Discussion questions",
          studentWork: "Write 2-3 open-ended prompts.",
          aiStarter: "Ask classmates to compare tradeoffs, predict outcomes, or evaluate incentives."
        },
        {
          slide: "7",
          title: "MLA works cited",
          studentWork: "Cite the main article plus every chart, image, and statistic.",
          aiStarter: "Do not trust AI citations until you verify each source."
        }
      ],
      visualIdeas: [
        "Impact matrix for Slide 4",
        "Annotated chart using a non-stock data source",
        "Timeline of the business event",
        "Icon-based stakeholder map"
      ],
      discussionQuestions: [
        "Who benefits most from this business decision, and who carries the risk?",
        "What would change if regulators, consumers, or competitors reacted differently?",
        "Which data point would most change your opinion about the story?"
      ],
      warnings: ["Presentation quality matters: rehearse, reduce text density, and cite visuals clearly."]
    };
  }

  function renderDraft(draft) {
    const outline = (draft.outline || [])
      .map(function (slide) {
        return (
          "Slide " +
          slide.slide +
          " - " +
          slide.title +
          "\nStudent work: " +
          slide.studentWork +
          "\nAI starter: " +
          slide.aiStarter
        );
      })
      .join("\n\n");

    const themes = (draft.themeIdeas || [])
      .map(function (item) {
        return "- " + item.title + ": " + item.reason;
      })
      .join("\n");

    const visuals = (draft.visualIdeas || []).map(function (item) {
      return "- " + item;
    });
    const questions = (draft.discussionQuestions || []).map(function (item) {
      return "- " + item;
    });
    const warnings = (draft.warnings || []).map(function (item) {
      return "- " + item;
    });

    planOutput.value = [
      draft.assistantMessage || "",
      "",
      "THEME IDEAS",
      themes,
      "",
      "SLIDE OUTLINE",
      outline,
      "",
      "VISUAL / DATA IDEAS",
      visuals.join("\n"),
      "",
      "DISCUSSION STARTERS",
      questions.join("\n"),
      "",
      "WATCHOUTS",
      warnings.join("\n")
    ].join("\n");
  }

  async function generateDraft() {
    if (!selected.length) {
      planStatus.textContent = "Select at least one article first.";
      return;
    }

    generateBtn.disabled = true;
    planStatus.textContent = "Asking the AI for a planning scaffold...";
    try {
      const response = await fetch("/api/article-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plan", survey: survey, selectedArticles: selected })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Plan generation failed.");
      CBNStore.setPlanDraft(data);
      renderDraft(data);
      planStatus.textContent = "AI scaffold generated. Now make it yours.";
    } catch (error) {
      const draft = localPlanDraft();
      CBNStore.setPlanDraft(draft);
      renderDraft(draft);
      planStatus.textContent =
        "Live AI was unavailable, so a local scaffold was created. " + error.message;
    } finally {
      generateBtn.disabled = false;
    }
  }

  if (generateBtn) generateBtn.addEventListener("click", generateDraft);
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      window.copyText(copyBtn, planOutput.value, "Copied!");
    });
  }
  if (manualForm) {
    manualForm.addEventListener("input", function () {
      const formData = new FormData(manualForm);
      localStorage.setItem("cbn.manualPlanNotes", JSON.stringify(Object.fromEntries(formData.entries())));
    });
  }

  renderSelected();
  const existing = CBNStore.getPlanDraft();
  if (existing) renderDraft(existing);
})();

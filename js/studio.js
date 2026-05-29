(function () {
  const state = {
    survey: window.CBNStore ? CBNStore.getSurvey() : {},
    articles: window.CBNStore ? CBNStore.getArticles() : [],
    selected: window.CBNStore ? CBNStore.getSelectedArticles() : [],
    planDraft: window.CBNStore ? CBNStore.getPlanDraft() : null,
    health: null,
    stage: "start"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  const hashStageMap = {
    top: "start",
    exampleStep: "example",
    surveyStep: "survey",
    articleStep: "articles",
    planStep: "plan",
    feedbackStep: "feedback",
    gradeStep: "grade"
  };

  const stageHelp = {
    start: {
      label: "Start here",
      text: "Study the example if you want, then begin the survey.",
      action: "Get Started",
      target: "survey"
    },
    example: {
      label: "Quality bar",
      text: "Notice the visual clarity and organization, then build your own plan.",
      action: "Start Survey",
      target: "survey"
    },
    survey: {
      label: "Your move",
      text: "Fill this out like you are choosing something you would actually talk about.",
      action: "Save survey",
      target: null
    },
    articles: {
      label: "Next step",
      text: "Run the search, select 1-3 strong articles, then generate your starter plan.",
      action: "Go to Plan",
      target: "plan"
    },
    plan: {
      label: "Build it",
      text: "Use the starter as a coach, not a script. Make the class connection and visuals yours.",
      action: "Ask for Feedback",
      target: "feedback"
    },
    feedback: {
      label: "Pressure test",
      text: "Paste one idea and let AI tell you what is weak before it reaches your slides.",
      action: "Grade Deck",
      target: "grade"
    },
    grade: {
      label: "Final check",
      text: "Upload a PDF export once the deck has real slides and visuals.",
      action: "View Example",
      target: "example"
    }
  };

  function setStage(stage, pushHash) {
    state.stage = stage || "start";
    $$(".stage-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.dataset.stage === state.stage);
    });
    document.body.dataset.activeStage = state.stage;
    renderNextStrip();
    if (pushHash !== false) {
      const hash = Object.keys(hashStageMap).find(function (key) {
        return hashStageMap[key] === state.stage;
      });
      if (hash) history.replaceState(null, "", "#" + hash);
    }
  }

  function renderNextStrip() {
    const strip = $("#stageNextStrip");
    if (!strip) return;
    const help = stageHelp[state.stage] || stageHelp.start;
    const selectedCount = state.selected.length;
    const disabled = state.stage === "articles" && selectedCount === 0;
    const extra = state.stage === "articles"
      ? selectedCount + " selected"
      : state.stage === "plan" && state.planDraft
        ? "Starter plan ready"
        : "";
    strip.innerHTML =
      '<div><span>' +
      escapeHtml(help.label) +
      '</span><strong>' +
      escapeHtml(help.text) +
      '</strong></div><div class="strip-actions">' +
      (extra ? '<em>' + escapeHtml(extra) + "</em>" : "") +
      (help.target
        ? '<button class="button secondary compact" type="button" data-stage-target="' +
          escapeHtml(help.target) +
          '"' +
          (disabled ? " disabled" : "") +
          ">" +
          escapeHtml(help.action) +
          "</button>"
        : "") +
      "</div>";
  }

  function setBusy(button, isBusy, label) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = isBusy;
    button.textContent = isBusy ? label || "Working..." : button.dataset.originalText;
  }

  function summarizeSurvey() {
    const summary = $("#studioSurveySummary");
    if (!summary) return;
    const industries = state.survey.industries || [];
    const industryText = Array.isArray(industries) ? industries.join(", ") : industries;
    summary.innerHTML = [
      ["Interests", state.survey.interests || "Not set yet"],
      ["Industries", industryText || "Not set yet"],
      ["Vibe", state.survey.vibe || state.survey.presentationStyle || "Not set yet"],
      ["Avoid", state.survey.constraints || "Nothing listed"]
    ]
      .map(function (row) {
        return "<div><span>" + row[0] + "</span><strong>" + escapeHtml(row[1]) + "</strong></div>";
      })
      .join("");
  }

  function renderSelectedTray() {
    const tray = $("#studioSelectedTray");
    if (!tray) return;
    if (!state.selected.length) {
      tray.innerHTML = '<span>No articles selected yet. Select at least one strong option before planning.</span>';
      renderNextStrip();
      return;
    }
    tray.innerHTML = '<strong>Selected:</strong>' + state.selected
      .map(function (article) {
        return '<article><span>' + escapeHtml(article.outlet || "Source") + "</span><b>" + escapeHtml(article.title) + "</b></article>";
      })
      .join("");
    renderNextStrip();
  }

  function firstWords(value, fallback) {
    return String(value || fallback || "")
      .split(/[,.]/)[0]
      .trim();
  }

  function buildStarterPlan() {
    const interests = firstWords(state.survey.interests, "a current business story");
    const industry = Array.isArray(state.survey.industries) && state.survey.industries.length
      ? state.survey.industries[0]
      : "business";
    const industryPhrase = industry.toLowerCase() === "business" ? "business" : industry + " business";
    const vibe = state.survey.vibe || state.survey.presentationStyle || "clean, confident, presentation-ready";
    const selected = state.selected[0];
    const selectedTitle = selected && selected.title ? selected.title : "";
    const selectedAngle = selected && selected.businessRelevance ? selected.businessRelevance : "";
    return {
      starterOnly: true,
      assistantMessage: selectedTitle
        ? "Starter plan preview: build around \"" + selectedTitle + "\" and make the business decision easy to explain."
        : "Starter direction: turn " + interests + " into a focused " + industryPhrase + " story.",
      topicLanes: [
        "Money angle: revenue, pricing, sponsorships, market share, or costs.",
        "People angle: customers, fans, creators, employees, or students affected by the story.",
        selectedAngle || "Strategy angle: what the company is changing and why it matters now."
      ],
      articleTarget: "Look for one recent article with numbers, one article that explains the company decision, and one source that gives broader context.",
      recommendedVibe: vibe,
      studentTasks: [
        "Pick the article with the clearest business decision, not just the coolest headline.",
        "Write a one-sentence theme that connects the story to a business concept from class.",
        "Find one chart, timeline, or comparison visual that makes the story easier to understand."
      ],
      themeIdeas: [
        {
          title: "The decision behind the headline",
          reason: "Make the CBN about the business choice, not just the news event.",
          visualStyle: vibe
        },
        {
          title: "Who wins, who pays, who changes",
          reason: "This gives you a clean way to explain stakeholders and consequences.",
          visualStyle: "sharp contrast, simple data callouts, one strong class connection"
        }
      ],
      outline: [
        {
          slide: 1,
          title: "Hook and headline",
          studentWork: "Open with the surprising stat, quote, or question that makes classmates care.",
          aiStarter: "Start with: Why is this business decision happening right now?",
          visualDirection: "Big headline, one image, one number."
        },
        {
          slide: 2,
          title: "What happened",
          studentWork: "Summarize the article in your own words and cite the source.",
          aiStarter: "Explain the company, the move, and the timing in 3-4 bullets.",
          visualDirection: "Timeline or before/after."
        },
        {
          slide: 3,
          title: "Business connection",
          studentWork: "Connect it to a class concept like marketing, demand, competition, revenue, or ethics.",
          aiStarter: "Use the concept as the lens for the rest of the presentation.",
          visualDirection: "Concept label plus example from the article."
        },
        {
          slide: 4,
          title: "Why it matters",
          studentWork: "Show impact on customers, company strategy, competitors, or the market.",
          aiStarter: "Use one data point or comparison to prove the impact.",
          visualDirection: "Chart, scorecard, or stakeholder map."
        },
        {
          slide: 5,
          title: "Discussion question",
          studentWork: "Ask a question classmates can actually debate.",
          aiStarter: "Make them choose a side, not give a yes/no answer.",
          visualDirection: "Two-option decision slide."
        }
      ],
      presentationMoves: [
        "Do not read paragraphs from the slide.",
        "Use the article as evidence, then explain the business logic yourself.",
        "Practice the hook and class connection out loud before building extra design."
      ]
    };
  }

  function renderStarterDirection() {
    const target = $("#studioStarterDirection");
    if (!target) return;
    const starter = state.planDraft || buildStarterPlan();
    target.innerHTML =
      '<div class="starter-copy"><span>Starter direction</span><strong>' +
      escapeHtml(starter.assistantMessage || "Here is your starting direction.") +
      '</strong><p>' +
      escapeHtml(starter.articleTarget || "Find a current article with a clear business decision, evidence, and classroom connection.") +
      '</p></div><div class="starter-cards">' +
      (starter.topicLanes || []).slice(0, 3).map(function (lane) {
        return "<article>" + escapeHtml(lane) + "</article>";
      }).join("") +
      '</div><div class="starter-tasks"><strong>First three tasks</strong><ol>' +
      (starter.studentTasks || []).slice(0, 3).map(function (task) {
        return "<li>" + escapeHtml(task) + "</li>";
      }).join("") +
      "</ol></div>";
  }

  function renderArticles() {
    const out = $("#studioArticleOutput");
    if (!state.articles.length) {
      out.innerHTML =
        '<div class="empty-state"><strong>Ready when you are.</strong><p>Click Find articles and the AI will return large readable article cards here.</p></div>';
      renderSelectedTray();
      return;
    }

    out.innerHTML =
      '<div class="article-grid-large">' +
      state.articles
        .map(function (article) {
          const selected = state.selected.some(function (item) {
            return item.id === article.id;
          });
          const ideas = (article.dataIdeas || [])
            .slice(0, 3)
            .map(function (idea) {
              return "<li>" + escapeHtml(idea) + "</li>";
            })
            .join("");
          return (
            '<article class="article-card-large ' +
            (selected ? "is-selected" : "") +
            '"><div class="article-card-top"><span class="card-badge">' +
            escapeHtml(article.outlet || "Source") +
            "</span><span>" +
            escapeHtml(article.date || "Verify date") +
            "</span></div><h3>" +
            escapeHtml(article.title || "Untitled article") +
            "</h3><p>" +
            escapeHtml(article.summary || "") +
            '</p><div class="article-meta"><strong>Business angle</strong><span>' +
            escapeHtml(article.businessRelevance || "") +
            '</span></div><div class="article-meta"><strong>Theme potential</strong><span>' +
            escapeHtml(article.themePotential || "") +
            "</span></div>" +
            (ideas ? '<ul class="mini-list">' + ideas + "</ul>" : "") +
            '<div class="article-actions"><a class="button ghost compact" href="' +
            escapeHtml(article.url || "#") +
            '" target="_blank" rel="noopener">Open source</a><button class="button secondary compact" data-select-article="' +
            escapeHtml(article.id) +
            '" type="button">' +
            (selected ? "Selected" : "Select article") +
            "</button></div></article>"
          );
        })
        .join("") +
      "</div>";
    renderSelectedTray();
    renderNextStrip();
  }

  function renderPlan(data) {
    const out = $("#studioPlanOutput");
    if (!data) data = buildStarterPlan();
    const themes = (data.themeIdeas || [])
      .map(function (item) {
        return '<article><h4>' + escapeHtml(item.title) + '</h4><p>' + escapeHtml(item.reason) + '</p><span>' + escapeHtml(item.visualStyle || "") + "</span></article>";
      })
      .join("");
    const outline = (data.outline || [])
      .map(function (slide) {
        return '<article><span>Slide ' + escapeHtml(slide.slide) + '</span><h4>' + escapeHtml(slide.title) + '</h4><p><strong>Do:</strong> ' + escapeHtml(slide.studentWork) + '</p><p><strong>Starter:</strong> ' + escapeHtml(slide.aiStarter) + '</p><p><strong>Visual:</strong> ' + escapeHtml(slide.visualDirection || "") + "</p></article>";
      })
      .join("");
    out.innerHTML =
      '<div class="ai-response"><h3>' +
      escapeHtml(data.assistantMessage || "Plan generated.") +
      '</h3><div class="plan-warning"><strong>Do not copy this directly.</strong><span>Use it as your starting map. Your job is to write the actual slides, citations, visuals, and speaking points.</span></div><h4>Your job</h4><ul>' +
      (data.studentTasks || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Theme directions</h4><div class="response-grid">' +
      themes +
      '</div><h4>Slide plan</h4><div class="slide-plan-grid">' +
      outline +
      '</div><h4>Presentation moves</h4><ul>' +
      (data.presentationMoves || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      "</ul></div>";
    renderNextStrip();
  }

  function renderFeedback(data) {
    $("#studioFeedbackOutput").innerHTML =
      '<div class="ai-response"><h3>' +
      escapeHtml(data.assistantMessage || "Feedback ready.") +
      '</h3><div class="verdict">Verdict: ' +
      escapeHtml(data.verdict || "reviewed") +
      '</div><h4>What works</h4><ul>' +
      (data.whatWorks || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Problems</h4><ul>' +
      (data.problems || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Better options</h4><ul>' +
      (data.betterOptions || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Rewrite</h4><p>' +
      escapeHtml(data.rewrite || "") +
      '</p><div class="next-step">' +
      escapeHtml(data.nextStep || "Revise and ask again.") +
      "</div></div>";
  }

  function renderGrade(data) {
    $("#studioGradeOutput").innerHTML =
      '<div class="ai-response"><h3>' +
      escapeHtml(data.assistantMessage || "Grade ready.") +
      '</h3><div class="score-pill">Estimated grade: ' +
      escapeHtml(data.scoreEstimate || "Needs review") +
      '</div><h4>Top fixes</h4><ul>' +
      (data.topFixes || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Formatting</h4><ul>' +
      (data.formatting || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Wording</h4><ul>' +
      (data.wording || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Visuals</h4><ul>' +
      (data.visuals || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      '</ul><h4>Slide notes</h4><div class="slide-plan-grid">' +
      (data.slideNotes || []).map(function (item) { return "<article><span>" + escapeHtml(item.slide) + "</span><p>" + escapeHtml(item.feedback) + "</p></article>"; }).join("") +
      "</div></div>";
  }

  async function callAi(payload) {
    const response = await fetch("/api/cbn-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "AI request failed.");
    return data;
  }

  async function refreshHealth() {
    try {
      const response = await fetch("/api/health");
      state.health = await response.json();
      const status = $("#studioHealth");
      if (status) {
        status.textContent = state.health.hasOpenAiKey ? "AI connected" : "AI setup needed";
        status.classList.toggle("is-warn", !state.health.hasOpenAiKey);
      }
    } catch (error) {
      const status = $("#studioHealth");
      if (status) {
        status.textContent = "AI status unknown";
        status.classList.add("is-warn");
      }
    }
  }

  function wireSurvey() {
    const form = $("#studioSurveyForm");
    const saved = state.survey || {};
    Object.keys(saved).forEach(function (key) {
      if (key === "industries" && form.elements.industriesText) {
        form.elements.industriesText.value = Array.isArray(saved.industries) ? saved.industries.join(", ") : saved.industries || "";
      } else if (form.elements[key]) {
        form.elements[key].value = saved[key] || "";
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      state.survey = {
        name: data.get("name") || "",
        interests: data.get("interests") || "",
        industries: String(data.get("industriesText") || "")
          .split(",")
          .map(function (item) { return item.trim(); })
          .filter(Boolean),
        comfort: data.get("comfort") || "",
        vibe: data.get("vibe") || "",
        constraints: data.get("constraints") || "",
        sourcePreference: data.get("sourcePreference") || "",
        presentationStyle: data.get("presentationStyle") || ""
      };
      CBNStore.setSurvey(state.survey);
      state.planDraft = buildStarterPlan();
      CBNStore.setPlanDraft(state.planDraft);
      summarizeSurvey();
      renderStarterDirection();
      renderPlan(state.planDraft);
      setStage("articles");
    });
  }

  function wireAiForms() {
    $("#studioArticleForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      const button = event.submitter;
      setBusy(button, true, "Finding...");
      $("#studioArticleOutput").innerHTML = '<div class="loading-panel">Searching credible business news...</div>';
      try {
        const data = await callAi({
          mode: "article_search",
          survey: state.survey,
          selectedArticles: state.selected,
          messages: [{ role: "user", content: $("#studioArticlePrompt").value || "Find 5-10 credible CBN article options." }]
        });
        state.articles = CBNStore.addArticles(data.articles || []);
        renderArticles();
        renderStarterDirection();
      } catch (error) {
        $("#studioArticleOutput").innerHTML = '<div class="empty-state error-state"><strong>Search failed</strong><p>' + escapeHtml(error.message) + "</p></div>";
      } finally {
        setBusy(button, false);
      }
    });

    $("#studioPlanForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      const button = event.submitter;
      const vibe = {
        style: $("#vibeStyle").value,
        classConnection: $("#vibeConnection").value,
        hook: $("#vibeHook").value,
        prompt: $("#studioPlanPrompt").value
      };
      setBusy(button, true, "Planning...");
      $("#studioPlanOutput").innerHTML = '<div class="loading-panel">Building your deck direction...</div>';
      try {
        const data = await callAi({ mode: "plan", survey: state.survey, selectedArticles: state.selected, vibe: vibe });
        state.planDraft = data;
        CBNStore.setPlanDraft(data);
        renderPlan(data);
      } catch (error) {
        $("#studioPlanOutput").innerHTML = '<div class="empty-state error-state"><strong>Plan failed</strong><p>' + escapeHtml(error.message) + "</p></div>";
      } finally {
        setBusy(button, false);
      }
    });

    $("#studioFeedbackForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      const button = event.submitter;
      setBusy(button, true, "Reviewing...");
      $("#studioFeedbackOutput").innerHTML = '<div class="loading-panel">Pressure-testing your idea...</div>';
      try {
        const data = await callAi({
          mode: "feedback",
          survey: state.survey,
          selectedArticles: state.selected,
          planDraft: state.planDraft,
          userText: $("#studioFeedbackPrompt").value
        });
        renderFeedback(data);
        setStage("grade");
      } catch (error) {
        $("#studioFeedbackOutput").innerHTML = '<div class="empty-state error-state"><strong>Feedback failed</strong><p>' + escapeHtml(error.message) + "</p></div>";
      } finally {
        setBusy(button, false);
      }
    });

    $("#studioGradeForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      const file = $("#deckPdfInput").files[0];
      if (!file) {
        $("#studioGradeOutput").innerHTML = '<div class="empty-state error-state"><strong>Choose a PDF first</strong><p>Export your presentation as PDF, then upload it here.</p></div>';
        return;
      }
      const button = event.submitter;
      setBusy(button, true, "Grading...");
      $("#studioGradeOutput").innerHTML = '<div class="loading-panel">Reading your PDF deck...</div>';
      try {
        const fileData = await fileToBase64(file);
        const data = await callAi({
          mode: "deck_grade",
          filename: file.name,
          fileData: fileData,
          survey: state.survey,
          selectedArticles: state.selected,
          planDraft: state.planDraft,
          userText: $("#gradeContext").value
        });
        renderGrade(data);
      } catch (error) {
        $("#studioGradeOutput").innerHTML = '<div class="empty-state error-state"><strong>Grading failed</strong><p>' + escapeHtml(error.message) + "</p></div>";
      } finally {
        setBusy(button, false);
      }
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result).split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  document.addEventListener("click", function (event) {
    const jump = event.target.closest("[data-jump]");
    if (jump) {
      const target = jump.getAttribute("data-jump").replace("#", "");
      setStage(hashStageMap[target] || target);
    }

    const stageTarget = event.target.closest("[data-stage-target]");
    if (stageTarget) {
      setStage(stageTarget.getAttribute("data-stage-target"));
    }

    const select = event.target.closest("[data-select-article]");
    if (select) {
      const id = select.getAttribute("data-select-article");
      const article = state.articles.find(function (item) { return item.id === id; });
      if (!article) return;
      const selected = state.selected.some(function (item) { return item.id === id; });
      state.selected = selected
        ? state.selected.filter(function (item) { return item.id !== id; })
        : state.selected.concat([article]);
      CBNStore.setSelectedArticles(state.selected);
      if (!state.planDraft || state.planDraft.starterOnly) {
        state.planDraft = buildStarterPlan();
        CBNStore.setPlanDraft(state.planDraft);
        renderPlan(state.planDraft);
      }
      renderArticles();
      renderStarterDirection();
    }
  });

  $("#studioReset").addEventListener("click", function () {
    CBNStore.reset();
    window.location.reload();
  });

  refreshHealth();
  wireSurvey();
  wireAiForms();
  summarizeSurvey();
  if (!state.planDraft) {
    state.planDraft = buildStarterPlan();
  }
  renderStarterDirection();
  renderPlan(state.planDraft);
  renderArticles();
  setStage(hashStageMap[window.location.hash.replace("#", "")] || "start", false);
})();

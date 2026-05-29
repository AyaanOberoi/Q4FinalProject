(function () {
  const state = {
    survey: window.CBNStore ? CBNStore.getSurvey() : {},
    articles: window.CBNStore ? CBNStore.getArticles() : [],
    selected: window.CBNStore ? CBNStore.getSelectedArticles() : [],
    planDraft: window.CBNStore ? CBNStore.getPlanDraft() : null,
    health: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function jumpTo(selector) {
    const target = $(selector);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setBusy(button, isBusy, label) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = isBusy;
    button.textContent = isBusy ? label || "Working..." : button.dataset.originalText;
  }

  function summarizeSurvey() {
    const industries = state.survey.industries || [];
    const industryText = Array.isArray(industries) ? industries.join(", ") : industries;
    $("#studioSurveySummary").innerHTML = [
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
      tray.innerHTML = '<p class="muted-hint">No articles selected yet.</p>';
      return;
    }
    tray.innerHTML = state.selected
      .map(function (article) {
        return '<article><span>' + escapeHtml(article.outlet || "Source") + "</span><strong>" + escapeHtml(article.title) + "</strong></article>";
      })
      .join("");
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
  }

  function renderPlan(data) {
    const out = $("#studioPlanOutput");
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
      '</h3><h4>Theme directions</h4><div class="response-grid">' +
      themes +
      '</div><h4>Slide plan</h4><div class="slide-plan-grid">' +
      outline +
      '</div><h4>Presentation moves</h4><ul>' +
      (data.presentationMoves || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
      "</ul></div>";
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
      $("#studioHealth").textContent = state.health.hasOpenAiKey ? "AI connected" : "AI setup needed";
      $("#studioHealth").classList.toggle("is-warn", !state.health.hasOpenAiKey);
    } catch (error) {
      $("#studioHealth").textContent = "AI status unknown";
      $("#studioHealth").classList.add("is-warn");
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
      summarizeSurvey();
      jumpTo("#articleStep");
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
        jumpTo("#feedbackStep");
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
        jumpTo("#gradeStep");
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
    if (jump) jumpTo(jump.getAttribute("data-jump"));

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
      renderArticles();
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
  renderArticles();
})();

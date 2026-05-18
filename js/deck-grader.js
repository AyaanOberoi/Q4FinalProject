(function () {
  const G = window.ProjectGrader;

  function getCheckedRequirements(form) {
    return Array.from(form.querySelectorAll("input[name='deckRequirements']:checked")).map(function (input) {
      return input.value;
    });
  }

  function analyzeDeck(deckText) {
    var text = String(deckText || "");
    var lower = text.toLowerCase();
    var hasStockPhrase = /\bstock\b|\bshare price\b|\bshareholder\b|\bticker\b/.test(lower);
    var extraDataCue = /\b(survey|inflation|gdp|index|median|employment|budget|forecast|survey|million|billion|percent|census)\b/i.test(
      lower
    );
    return {
      wordCount: G.countWords(text),
      mentionsStockOnly: hasStockPhrase && !extraDataCue,
      mentionsMlaOrWorksCited: /\b(mla|cited|citation|bibliography|works cited)\b/i.test(lower)
    };
  }

  var deckFormEl = document.getElementById("deckForm");
  if (!deckFormEl || !window.ProjectGrader) {
    return;
  }

  deckFormEl.addEventListener("submit", function (event) {
    event.preventDefault();

    var form = event.target;
    var deckText = document.getElementById("deckOutline").value;
    var checked = getCheckedRequirements(form);
    var analysis = analyzeDeck(deckText);

    var completionScore =
      checked.filter(function (id) {
        return G.REQUIRED_CHECKBOX_IDS.indexOf(id) !== -1;
      }).length /
      G.REQUIRED_CHECKBOX_IDS.length;

    var baseCompletion = Math.round(completionScore * 40);

    var textScorePoints = Math.min(
      32,
      Math.round((Math.min(analysis.wordCount, 500) / 500) * 18) +
        (G.includesAny(deckText, G.dataTerms) ? 8 : analysis.wordCount > 240 ? 4 : 0) +
        (G.includesAny(deckText, G.businessTerms) ? 6 : 0)
    );

    if (analysis.mentionsStockOnly) {
      textScorePoints = Math.round(textScorePoints * 0.82);
    }

    var mlaBump = 0;
    if (checked.indexOf("mla") !== -1 && analysis.mentionsMlaOrWorksCited) {
      mlaBump = 12;
    } else if (checked.indexOf("mla") !== -1 || analysis.mentionsMlaOrWorksCited) {
      mlaBump = 7;
    } else if (analysis.wordCount > 120) {
      mlaBump = 4;
    }

    var titleLine = document.getElementById("deckPresentationTitle").value.trim();
    var titleBonus = titleLine.length > 4 ? 4 : titleLine.length > 0 ? 2 : 0;

    var sensitiveDiscussed =
      !!(form.querySelector("#deckTeacherOk") && form.querySelector("#deckTeacherOk").checked);
    var flaggedSensitive =
      !!(form.querySelector("#deckSensitiveNote") && form.querySelector("#deckSensitiveNote").checked);
    var sensitiveBonus = flaggedSensitive ? (sensitiveDiscussed ? 5 : 0) : 6;

    var score = Math.min(100, baseCompletion + textScorePoints + mlaBump + titleBonus + sensitiveBonus);

    document.getElementById("deckGradeScore").textContent = String(score);
    document.getElementById("deckGradeLabel").textContent = G.gradeLabel(score);

    document.getElementById("deckGradeSummary").textContent =
      "Heuristic preview only. Use the exported AI grading prompt below for deeper feedback from ChatGPT / Claude plus your teacher.";

    var feedback = G.buildDeckFeedback(score, checked, deckText, {
      hasSensitiveNote: document.getElementById("deckSensitiveNote").checked,
      sensitiveDiscussed: sensitiveDiscussed
    });

    var list = document.getElementById("deckFeedbackList");
    list.innerHTML = "";
    feedback.forEach(function (item) {
      var card = document.createElement("article");
      var title = document.createElement("h4");
      var body = document.createElement("p");
      title.textContent = item.title;
      body.textContent = item.body;
      card.append(title, body);
      list.append(card);
    });

    document.getElementById("deckAiPrompt").value = buildAiGradingPrompt({
      presentationTitle: titleLine || document.getElementById("deckPresentationTitle").value,
      outline: deckText,
      heuristicScore: score,
      checklist: checked,
      sensitivityNote: document.getElementById("deckSensitiveNote").checked
        ? document.getElementById("deckSensitiveDetails").value
        : ""
    });
  });

  function buildAiGradingPrompt(payload) {
    return [
      "You are an impartial business educator grading a high school Current Business News final presentation outline.",
      "Use the syllabus rules below plus the student's outline. Highlight gaps, redundancy, factual caution, MLA issues, visuals, quantitative evidence, neutrality, sensitivity handling, engagement, and pacing.",
      "Return: (A) Estimated letter grade bands A+/A/A- etc referencing specific missing elements, (B) Slide-by-slide feedback, (C) Rewrite suggestions for weakest slides, (D) Quiz three follow-up probes the teacher might ask.",
      "",
      "--- Official assignment constraints ---",
      "Seven slides:",
      "1 Name, headline, credible news outlet, article date, author.",
      "2 Summary.",
      "3 Company backdrop or contextual history.",
      "4 Economy; laws/policy/regulation futures; worldwide effects; classmates relevance.",
      "5 Connect to coursework or introduce & teach concept.",
      "6 Two or three provocative open questions.",
      "7 MLA citations including statistic/graph origins.",
      "Quantitative visuals required beyond solitary stock ticker chart; prioritize creative infographics versus plain bullets.",
      "Presentation stays objective; escalate sensitive topics after teacher clearance.",
      "",
      "--- Outline submitted ---",
      "Working title tag: " + (payload.presentationTitle || "n/a"),
      "Self-reported checklist items satisfied: " + (payload.checklist.length ? payload.checklist.join(", ") : "none flagged"),
      "Local heuristic guessed score (/100 heuristic only): " + payload.heuristicScore,
      "",
      payload.sensitivityNote
        ? "--- Sensitivity briefing from student ---\n" + payload.sensitivityNote + "\n"
        : "",
      payload.outline || "(outline missing)"
    ]
      .filter(Boolean)
      .join("\n");
  }

  var copyAiBtn = document.getElementById("deckCopyAiPromptBtn");
  if (copyAiBtn) {
    copyAiBtn.addEventListener("click", function () {
      var btn = document.getElementById("deckCopyAiPromptBtn");
      var checklist = [];
      var formChecked = deckFormEl.querySelectorAll("input[name='deckRequirements']:checked");
      formChecked.forEach(function (cb) {
        checklist.push(cb.value);
      });

      var text =
        document.getElementById("deckAiPrompt").value.trim() ||
        buildAiGradingPrompt({
          presentationTitle: document.getElementById("deckPresentationTitle").value.trim(),
          outline: document.getElementById("deckOutline").value,
          heuristicScore: document.getElementById("deckGradeScore").textContent || "--",
          checklist: checklist,
          sensitivityNote:
            document.getElementById("deckSensitiveNote") && document.getElementById("deckSensitiveNote").checked
              ? document.getElementById("deckSensitiveDetails").value
              : ""
        });
      window.copyText(btn, text, "Copied!");
    });
  }

  var sensToggle = document.getElementById("deckSensitiveNote");
  if (sensToggle && document.getElementById("deckSensitiveDetailsWrap")) {
    sensToggle.addEventListener("change", function (event) {
      document.getElementById("deckSensitiveDetailsWrap").hidden = !event.target.checked;
    });
  }
})();

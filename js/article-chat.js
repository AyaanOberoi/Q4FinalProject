(function () {
  const chatLog = document.getElementById("chatLog");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const status = document.getElementById("chatStatus");
  const articleList = document.getElementById("articleList");
  const selectedCount = document.getElementById("selectedCount");
  const moreBtn = document.getElementById("requestMoreArticles");
  const planBtn = document.getElementById("goToPlan");
  const surveySummary = document.getElementById("surveySummary");
  const setupBanner = document.getElementById("setupBanner");
  const retryHealth = document.getElementById("retryHealth");
  const resultsNextStep = document.getElementById("resultsNextStep");
  const clearFinder = document.getElementById("clearFinder");
  const transcriptPanel = document.querySelector(".transcript-panel");

  if (!chatLog || !window.CBNStore) return;

  let messages = CBNStore.getMessages();
  let articles = CBNStore.getArticles();
  let selected = CBNStore.getSelectedArticles();
  let setupRequired = false;
  const survey = CBNStore.getSurvey();

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function setBusy(isBusy, label) {
    document.body.classList.toggle("is-busy", isBusy);
    setStatus(label || "");
    if (input) input.disabled = isBusy || setupRequired;
    if (form) form.querySelector("button[type='submit']").disabled = isBusy || setupRequired;
    if (moreBtn) moreBtn.disabled = isBusy || setupRequired || !articles.length;
  }

  function setSetupState(isRequired, message) {
    setupRequired = isRequired;
    if (setupBanner) {
      setupBanner.hidden = !isRequired;
      const paragraph = setupBanner.querySelector("p");
      if (paragraph && message) paragraph.textContent = message;
    }
    setBusy(false, isRequired ? "Teacher/developer setup needed before live article search can run." : status.textContent);
  }

  function renderSurveySummary() {
    if (!surveySummary) return;
    const industries = (survey.industries || []).join(", ") || "No industries picked yet";
    const interests = survey.interests || "No interests entered yet";
    const style = survey.presentationStyle || "Presentation style not chosen";
    surveySummary.innerHTML =
      '<div><span>Name</span><strong>' +
      escapeHtml(survey.name || "Student") +
      "</strong></div><div><span>Industries</span><strong>" +
      escapeHtml(industries) +
      "</strong></div><div><span>Interests</span><strong>" +
      escapeHtml(interests) +
      "</strong></div><div><span>Style</span><strong>" +
      escapeHtml(style) +
      "</strong></div>";
  }

  function renderChat() {
    if (transcriptPanel) transcriptPanel.hidden = messages.length === 0;
    chatLog.innerHTML = "";
    if (!messages.length) {
      chatLog.innerHTML =
        '<div class="empty-state compact"><strong>No search yet</strong><p>Start with Find articles. If the AI needs more detail, follow-up questions will appear here.</p></div>';
      return;
    }

    messages.forEach(function (message) {
      const node = document.createElement("article");
      node.className = "chat-message " + (message.role === "user" ? "user" : "assistant");
      node.textContent = message.content;
      chatLog.append(node);
    });
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderArticles() {
    articleList.innerHTML = "";
    if (!articles.length) {
      articleList.innerHTML =
        '<div class="empty-state"><strong>No article cards yet</strong><p>Next step: click Find articles. The AI will return credible options with links, business angles, theme ideas, and data suggestions.</p></div>';
    }

    articles.forEach(function (article) {
      const isSelected = selected.some(function (item) {
        return item.id === article.id;
      });
      const card = document.createElement("article");
      card.className = "article-card" + (isSelected ? " selected" : "");

      const dataIdeas = (article.dataIdeas || [])
        .slice(0, 3)
        .map(function (idea) {
          return "<li>" + escapeHtml(idea) + "</li>";
        })
        .join("");

      card.innerHTML =
        '<div class="article-card-top"><span class="card-badge">' +
        escapeHtml(article.outlet || "Source") +
        "</span><span>" +
        escapeHtml(article.date || "Verify date") +
        "</span></div><h3>" +
        escapeHtml(article.title || "Untitled article") +
        "</h3><p>" +
        escapeHtml(article.summary || "") +
        '</p><div class="article-meta"><strong>Business angle</strong><span>' +
        escapeHtml(article.businessRelevance || "Verify why this matters for business.") +
        '</span></div><div class="article-meta"><strong>Theme potential</strong><span>' +
        escapeHtml(article.themePotential || "Theme TBD") +
        "</span></div>" +
        (dataIdeas ? '<ul class="mini-list">' + dataIdeas + "</ul>" : "") +
        '<div class="article-actions"><a class="button ghost compact" target="_blank" rel="noopener" href="' +
        escapeAttr(article.url || "#") +
        '">Open source</a><button class="button secondary compact" type="button" data-select="' +
        escapeAttr(article.id) +
        '">' +
        (isSelected ? "Selected" : "Select") +
        "</button></div>";

      articleList.append(card);
    });

    selectedCount.textContent = String(selected.length);
    planBtn.toggleAttribute("disabled", selected.length === 0);
    if (moreBtn) moreBtn.disabled = setupRequired || !articles.length;
    if (resultsNextStep) {
      resultsNextStep.textContent = selected.length
        ? "Next step: continue to Plan when your shortlist feels strong."
        : articles.length
          ? "Next step: select 1-3 strong articles, then continue to Plan."
          : "Next step: click Find articles.";
    }
  }

  async function checkHealth() {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setSetupState(Boolean(data.setupRequired), data.message);
      if (!data.setupRequired && !messages.length) setStatus("Next step: click Find articles.");
    } catch (error) {
      setSetupState(true, "Could not confirm AI setup. If this is deployed on Vercel, check OPENAI_API_KEY and redeploy.");
    }
  }

  async function askFinder(userText) {
    if (setupRequired) {
      setStatus("Teacher/developer setup needed before live article search can run.");
      return;
    }

    const nextMessages = userText ? messages.concat([{ role: "user", content: userText }]) : messages;
    messages = nextMessages;
    CBNStore.setMessages(messages);
    renderChat();
    setBusy(true, "Searching credible business-news sources...");

    try {
      const response = await fetch("/api/article-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "article", survey: survey, messages: messages, selectedArticles: selected })
      });
      const data = await response.json();

      if (data.setupRequired) {
        setSetupState(true, data.message);
        return;
      }
      if (!response.ok) throw new Error(data.message || data.error || "Article search failed.");

      if (data.assistantMessage) {
        messages = messages.concat([{ role: "assistant", content: data.assistantMessage }]);
      }
      if (data.followUpQuestions && data.followUpQuestions.length) {
        messages = messages.concat([
          { role: "assistant", content: "A few details would help: " + data.followUpQuestions.join(" ") }
        ]);
      }
      CBNStore.setMessages(messages);
      if (data.articles && data.articles.length) {
        articles = CBNStore.addArticles(data.articles);
      }
      renderChat();
      renderArticles();
      setBusy(false, data.articles && data.articles.length ? "Results loaded. Select 1-3 strong articles." : "Answer the follow-up, then search again.");
    } catch (error) {
      messages = messages.concat([
        {
          role: "assistant",
          content: "Search hit a problem: " + error.message
        }
      ]);
      CBNStore.setMessages(messages);
      renderChat();
      setBusy(false, "Search needs attention. Try again or revise the survey.");
    }
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const text = input.value.trim();
      input.value = "";
      askFinder(text || "Find 5 to 10 credible current business news articles based on my survey.");
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      askFinder("Find more article options. Avoid repeating the articles already shown or selected.");
    });
  }

  if (retryHealth) retryHealth.addEventListener("click", checkHealth);

  if (clearFinder) {
    clearFinder.addEventListener("click", function () {
      messages = [];
      articles = [];
      selected = [];
      CBNStore.setMessages(messages);
      CBNStore.addArticles([]);
      localStorage.removeItem("cbn.articleResults");
      CBNStore.setSelectedArticles(selected);
      renderChat();
      renderArticles();
      setStatus(setupRequired ? "Teacher/developer setup needed before live article search can run." : "Next step: click Find articles.");
    });
  }

  articleList.addEventListener("click", function (event) {
    const btn = event.target.closest("[data-select]");
    if (!btn) return;
    const id = btn.getAttribute("data-select");
    const article = articles.find(function (item) {
      return item.id === id;
    });
    if (!article) return;

    const already = selected.some(function (item) {
      return item.id === id;
    });
    selected = already
      ? selected.filter(function (item) {
          return item.id !== id;
        })
      : selected.concat([article]);
    CBNStore.setSelectedArticles(selected);
    renderArticles();
  });

  if (planBtn) {
    planBtn.addEventListener("click", function () {
      window.location.href = "plan-ai.html";
    });
  }

  renderSurveySummary();
  renderChat();
  renderArticles();
  checkHealth();
})();

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

  if (!chatLog || !window.CBNStore) return;

  let messages = CBNStore.getMessages();
  let articles = CBNStore.getArticles();
  let selected = CBNStore.getSelectedArticles();
  const survey = CBNStore.getSurvey();

  function setBusy(isBusy, label) {
    document.body.classList.toggle("is-busy", isBusy);
    if (status) status.textContent = label || "";
    if (input) input.disabled = isBusy;
    if (moreBtn) moreBtn.disabled = isBusy;
  }

  function renderSurveySummary() {
    if (!surveySummary) return;
    const industries = (survey.industries || []).join(", ") || "No industries picked yet";
    surveySummary.innerHTML =
      "<strong>" +
      (survey.name || "Student") +
      "</strong><span>" +
      industries +
      "</span><span>" +
      (survey.interests || "Interests not filled in yet") +
      "</span>";
  }

  function renderChat() {
    chatLog.innerHTML = "";
    const intro = messages.length
      ? []
      : [
          {
            role: "assistant",
            content:
              "I have your survey. Send one more preference if you want, or hit Find articles and I will look for credible CBN options."
          }
        ];
    intro.concat(messages).forEach(function (message) {
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
        '<p class="muted-hint">No article cards yet. Ask the finder to search once you are ready.</p>';
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
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  async function askFinder(userText) {
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
      setBusy(false, data.articles && data.articles.length ? "Article cards updated." : "Answer the follow-up, then search again.");
    } catch (error) {
      messages = messages.concat([
        {
          role: "assistant",
          content:
            "I could not complete the live search yet. " +
            error.message +
            " If the key is missing, ask your teacher to start the server with OPENAI_API_KEY set."
        }
      ]);
      CBNStore.setMessages(messages);
      renderChat();
      setBusy(false, "Search needs attention.");
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
})();

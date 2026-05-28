(function (global) {
  const KEYS = {
    survey: "cbn.survey",
    chatMessages: "cbn.chatMessages",
    articleResults: "cbn.articleResults",
    selectedArticles: "cbn.selectedArticles",
    planDraft: "cbn.planDraft"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function upsertArticles(existing, incoming) {
    const map = new Map();
    existing.concat(incoming || []).forEach(function (article, index) {
      const id = article.id || article.url || article.title || String(index);
      map.set(id, Object.assign({}, article, { id: id }));
    });
    return Array.from(map.values());
  }

  global.CBNStore = {
    getSurvey: function () {
      return read(KEYS.survey, {});
    },
    setSurvey: function (survey) {
      write(KEYS.survey, survey || {});
    },
    getMessages: function () {
      return read(KEYS.chatMessages, []);
    },
    setMessages: function (messages) {
      write(KEYS.chatMessages, messages || []);
    },
    getArticles: function () {
      return read(KEYS.articleResults, []);
    },
    addArticles: function (articles) {
      const next = upsertArticles(read(KEYS.articleResults, []), articles || []);
      write(KEYS.articleResults, next);
      return next;
    },
    getSelectedArticles: function () {
      return read(KEYS.selectedArticles, []);
    },
    setSelectedArticles: function (articles) {
      write(KEYS.selectedArticles, articles || []);
    },
    setPlanDraft: function (draft) {
      write(KEYS.planDraft, draft || {});
    },
    getPlanDraft: function () {
      return read(KEYS.planDraft, null);
    },
    reset: function () {
      Object.keys(KEYS).forEach(function (key) {
        localStorage.removeItem(KEYS[key]);
      });
    }
  };
})(window);

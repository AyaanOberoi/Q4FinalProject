(function () {
  const root = document.getElementById("nav-root");
  if (!root) return;

  const pageKey = document.body.dataset.page || "";

  fetch("partials/nav.html")
    .then(function (res) {
      if (!res.ok) throw new Error("nav fetch failed");
      return res.text();
    })
    .then(function (html) {
      root.innerHTML = html.trim();
      if (pageKey) {
        const link = root.querySelector('[data-nav="' + pageKey + '"]');
        if (link) link.classList.add("nav-active");
      }
    })
    .catch(function () {
      root.innerHTML =
        '<nav class="nav site-nav" aria-label="Main navigation">' +
        '<a class="brand" href="index.html">Coach</a>' +
        '<div class="nav-links">' +
        '<a href="guide.html">Guide</a>' +
        '<a href="plan-ai.html">Plan with AI</a>' +
        '<a href="grade-deck.html">Grade deck</a>' +
        "</div>" +
        "</nav>" +
        '<p class="nav-fallback-msg">Serve this site over <code>http://localhost</code> (not file://) to load the full navigation.</p>';
    });
})();

window.copyText = function copyText(button, text, doneLabel) {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      window.prompt("Copy this text:", text);
    }
    ta.remove();
    if (button) {
      const original = button.textContent;
      button.textContent = doneLabel || "Copied";
      window.setTimeout(function () {
        button.textContent = original;
      }, 1600);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      if (button) {
        const original = button.textContent;
        button.textContent = doneLabel || "Copied";
        window.setTimeout(function () {
          button.textContent = original;
        }, 1600);
      }
    }, fallback);
  } else {
    fallback();
  }
};

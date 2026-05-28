(function () {
  const track = document.getElementById("sampleDeckTrack");
  const count = document.getElementById("sampleDeckCount");
  const prev = document.getElementById("sampleDeckPrev");
  const next = document.getElementById("sampleDeckNext");
  if (!track) return;

  let slides = [];
  let index = 0;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function render() {
    const slide = slides[index];
    if (!slide) {
      track.innerHTML = '<p class="muted-hint">Sample deck preview could not load.</p>';
      return;
    }
    const bullets = (slide.bullets || [])
      .slice(0, 8)
      .map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      })
      .join("");
    track.innerHTML =
      '<article class="sample-slide"><span>Slide ' +
      slide.number +
      '</span><h3>' +
      escapeHtml(slide.title) +
      "</h3>" +
      (bullets ? "<ul>" + bullets + "</ul>" : '<p class="muted-hint">Visual/data slide. Open the PPTX to inspect the full design.</p>') +
      "</article>";
    if (count) count.textContent = index + 1 + " / " + slides.length;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  }

  fetch("assets/sample-cbn/deck-slides.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Could not load sample deck.");
      return res.json();
    })
    .then(function (data) {
      slides = data.slides || [];
      render();
    })
    .catch(function () {
      track.innerHTML = '<p class="muted-hint">Sample deck preview could not load. Use the download button.</p>';
    });

  if (prev) {
    prev.addEventListener("click", function () {
      index = Math.max(0, index - 1);
      render();
    });
  }
  if (next) {
    next.addEventListener("click", function () {
      index = Math.min(slides.length - 1, index + 1);
      render();
    });
  }
})();

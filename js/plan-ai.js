(function () {
  const ASSIGNMENT_SHELL = [
    "Project rules (keep objective, not opinion): summarize a current business news story from mainstream news (not primary source from social media; social OK as supporting citation). Seven slides:",
    "1) Name, headline, news source name, publication date of article, author.",
    "2) Summary.",
    "3) Company background, or historical context if no company.",
    "4) Implications: US economy; regulations/laws/policy; global; students in this room relevance.",
    "5) Class connection or introduce a concept we have not studied (teach clearly).",
    "6) 2–3 open-ended discussion questions.",
    "7) MLA Works Cited including data/graph sources.",
    "Include quantitative proof beyond a lone stock chart; visuals should be graphical, not plain bullet piles."
  ].join("\n");

  function gatherForm() {
    return {
      name: document.getElementById("planStudentName").value.trim(),
      articleTitle: document.getElementById("planArticleTitle").value.trim(),
      source: document.getElementById("planSource").value.trim(),
      url: document.getElementById("planUrl").value.trim(),
      angle: document.getElementById("planAngle").value.trim(),
      concept: document.getElementById("planConcept").value.trim(),
      dataIdeas: document.getElementById("planData").value.trim(),
      audienceHooks: document.getElementById("planHooks").value.trim(),
      questions: document.getElementById("planQuestions").value.trim(),
      sensitivities: document.getElementById("planSensitivities").value.trim()
    };
  }

  function buildPrompt(data) {
    return [
      "Act as an experienced business teacher helping a high school student plan a slideshow presentation.",
      "Follow these assignment constraints verbatim:",
      ASSIGNMENT_SHELL,
      "",
      "--- Student notes ---",
      data.name ? "Student name: " + data.name : "Student name: (provide on Slide 1)",
      data.articleTitle ? "Working headline idea: " + data.articleTitle : "Headline/TBD:",
      data.source ? "News source planned: " + data.source : "Source:",
      data.url ? "Link: " + data.url : "",
      data.angle ? "Story angle student wants: " + data.angle : "",
      data.concept ? "Likely classroom concept hooks: " + data.concept : "",
      data.dataIdeas ? "Data/visual ideas gathered so far: " + data.dataIdeas : "",
      data.audienceHooks ? "Audience engagement ideas / props Pass-out ideas: " + data.audienceHooks : "",
      data.questions ? "Rough discussion prompts: " + data.questions : "",
      data.sensitivities ? "Sensitivities to handle carefully / speak with teacher: " + data.sensitivities : "",
      "",
      "Deliver:",
      "- Slide-by-slide talking points matching the assignment labels.",
      "- Two visual metaphors per slide besides bullet lists.",
      "- A numbered list describing which graphs/charts/tables/statistics satisfy the quantitative requirement (not solely a stock graphic).",
      "- A rehearsal checklist reminding them to cite sources verbally and objectively.",
      "- Flag anything missing versus the checklist."
    ]
      .filter(Boolean)
      .join("\n");
  }

  const out = document.getElementById("planPromptOutput");
  const btn = document.getElementById("planGeneratePrompt");
  const copyBtn = document.getElementById("planCopyPrompt");

  function render() {
    const text = buildPrompt(gatherForm());
    out.value = text;
    return text;
  }

  if (btn) {
    btn.addEventListener("click", function () {
      render();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      const text = out.value.trim() ? out.value.trim() : buildPrompt(gatherForm());
      window.copyText(copyBtn, text, "Copied!");
    });
  }

  // Initial blank state message
  if (out && !out.value.trim()) {
    out.value =
      "Click “Build planning prompt”. Paste the prompt into ChatGPT, Claude, or another assistant you trust. Nothing is uploaded from this website.";
  }
})();

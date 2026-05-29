(function () {
  const map = {
    "survey.html": "surveyStep",
    "article-chat.html": "articleStep",
    "plan-ai.html": "planStep",
    "grade-deck.html": "gradeStep"
  };
  const page = window.location.pathname.split("/").pop();
  if (map[page]) {
    window.location.replace("index.html#" + map[page]);
  }
})();

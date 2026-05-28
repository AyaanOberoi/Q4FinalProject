(function () {
  const form = document.getElementById("surveyForm");
  if (!form || !window.CBNStore) return;

  const saved = CBNStore.getSurvey();
  Object.keys(saved).forEach(function (key) {
    const field = form.elements[key];
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach(function (input) {
        if (Array.isArray(saved[key])) input.checked = saved[key].indexOf(input.value) !== -1;
        else input.checked = saved[key] === input.value;
      });
    } else {
      field.value = saved[key] || "";
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = new FormData(form);
    const survey = {
      name: data.get("name") || "",
      interests: data.get("interests") || "",
      industries: data.getAll("industries"),
      comfort: data.get("comfort") || "",
      presentationStyle: data.get("presentationStyle") || "",
      constraints: data.get("constraints") || "",
      sourcePreference: data.get("sourcePreference") || "",
      teacherNotes: data.get("teacherNotes") || ""
    };
    CBNStore.setSurvey(survey);
    window.location.href = "article-chat.html";
  });

  const resetBtn = document.getElementById("surveyReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      CBNStore.reset();
      form.reset();
    });
  }
})();

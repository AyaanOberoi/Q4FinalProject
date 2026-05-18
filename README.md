# Business News Project Coach

A static, multi-page site for the Q4 current business news presentation. It explains requirements, collects teacher-facing notes, showcases exemplar placeholders, helps students **compose AI planning prompts**, and grades exported slide outlines locally **plus** by copying a fuller prompt into ChatGPT / Claude / Gemini.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Hub with shortcuts |
| `guide.html` | Rubric weights + Slide 1–7 map + visual tips |
| `plan-ai.html` | Guided fields → mega-prompt (paste into any AI assistant) |
| `grade-deck.html` | Heuristic scorer + AI grading prompt for pasted outlines |
| `examples.html` | Placeholder tiles for standout decks |
| `teacher-notes.html` | Logistics / sensitivity playbook (edit freely) |

Shared chrome loads from `partials/nav.html` via `js/site.js`.

## Run locally

Use a lightweight server so `fetch("partials/nav.html")` works (opening raw `file://` skips the navbar):

```bash
cd "/Users/ayaanoberoi/Code/Q4 Final project business"
python3 -m http.server 8080
```

Browse `http://localhost:8080/`.

## Deploy (GitHub Pages)

1. Push the repo.
2. **Settings → Pages →** Source: `main` / root *(or `/docs` if you relocate files)*  
3. Because assets use relative URLs, subdirectory publishing may need adjusting—root hosting is simplest.

## AI disclaimer

Coach never calls proprietary models directly:

- **Plan with AI** only formats instructions for assistants you paste into.
- **Grade deck** runs a heuristic in-browser and builds a grading prompt embedding the syllabus text.

Treat every external-AI citation as provisional until corroborated with primary sources.


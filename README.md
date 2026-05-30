# Business News Project Coach

A one-page AI studio for the Q4 current business news presentation. Students move through a cinematic home flow: survey, article finder, vibe/plan builder, feedback coach, and PDF deck grader. The 100-point Cowboys Chiefs CBN example is built into the home page.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Main one-page CBN AI Studio |
| `survey.html` | Redirects into the one-page survey section |
| `article-chat.html` | Redirects into the one-page article finder |
| `api/cbn-ai.js` | Unified AI endpoint for article search, planning, feedback, and PDF grading |
| `api/health.js` | Safe setup check for whether server-side AI is configured |
| `guide.html` | Rubric weights + Slide 1–7 map + visual tips |
| `plan-ai.html` | Redirects into the one-page planning section |
| `grade-deck.html` | Redirects into the one-page PDF grader |
| `teacher-notes.html` | Logistics / sensitivity playbook (edit freely) |

Student survey, article, and plan selections are stored in `localStorage`.

## Run locally

Use the included Node server. It serves static files and keeps the OpenAI key server-side:

```bash
cd "/Users/ayaanoberoi/Code/Q4 Final project business"
OPENAI_API_KEY="your_key_here" npm start
```

Browse `http://localhost:8080/`.

Without `OPENAI_API_KEY`, the app still loads. AI actions return a setup message and do not pretend live search or grading worked.

## Deploy

Because the article finder needs a private API key, deploy this on a Node-capable host instead of plain GitHub Pages. Vercel is supported through `api/article-chat.js`.

On Vercel, add `OPENAI_API_KEY` in **the exact project that hosts this app**:

1. Open the Vercel project.
2. Go to **Settings → Environment Variables**.
3. Add `OPENAI_API_KEY`.
4. Enable it for **Production** and **Preview**. Add **Development** too if you use `vercel dev`.
5. Save, then trigger a fresh redeploy. Existing deployments do not receive new environment variables retroactively.

You can verify setup without exposing secrets by opening `/api/health`; it only returns whether the key exists.

Optional CLI setup:

```bash
vercel env add OPENAI_API_KEY production preview development
vercel --prod
```

## AI behavior

The browser never sees the OpenAI API key. `server.js` locally and `api/cbn-ai.js` on Vercel call OpenAI's Responses API. Article search uses web search; PDF grading sends a base64 PDF file input to the server-side API.

For faster responses, the app uses `OPENAI_FAST_MODEL` when it is set, then `OPENAI_MODEL`, then `gpt-5-mini`. PDF grading can use `OPENAI_DEEP_MODEL` for a stronger model without slowing down normal article search and planning. Article search is intentionally capped to fewer article cards and fewer web-search calls so the UI feels responsive.

Treat every AI citation as provisional until corroborated with the original article, data source, or MLA citation tool.

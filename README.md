# Business News Project Coach

A multi-page site for the Q4 current business news presentation. Students complete an interest survey, use an AI-backed article finder, select article candidates, build a planning scaffold, and grade their deck against the rubric. The grade page includes a baked-in 100-point sample PowerPoint.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Hub with shortcuts |
| `survey.html` | Interest survey that saves student preferences locally |
| `article-chat.html` | AI article finder backed by `POST /api/article-chat` |
| `api/health.js` | Safe setup check for whether server-side AI is configured |
| `guide.html` | Rubric weights + Slide 1–7 map + visual tips |
| `plan-ai.html` | Planning workspace using selected articles |
| `grade-deck.html` | Heuristic scorer + baked-in 100-point sample deck |
| `teacher-notes.html` | Logistics / sensitivity playbook (edit freely) |

Shared chrome loads from `partials/nav.html` via `js/site.js`. Student survey/chat selections are stored in `localStorage`.

## Run locally

Use the included Node server. It serves static files and keeps the OpenAI key server-side:

```bash
cd "/Users/ayaanoberoi/Code/Q4 Final project business"
OPENAI_API_KEY="your_key_here" npm start
```

Browse `http://localhost:8080/`.

Without `OPENAI_API_KEY`, the app still loads. The article finder shows an **AI setup needed** banner and does not pretend live search worked.

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

The browser never sees the OpenAI API key. `server.js` locally and `api/article-chat.js` on Vercel call OpenAI's Responses API with web search enabled and ask for structured JSON article cards or planning guidance.

Treat every AI citation as provisional until corroborated with the original article, data source, or MLA citation tool.

# Proseidon

Climb ten levels of English, from parts of speech to PhD. Live at https://proseidon.proseidonplay.workers.dev

## What's here

- `public/`: the game (index.html, app.js) and the shared question bank (bank.js)
- `netlify/functions/lib/core.mjs`: the server logic for accounts, scored rounds, leaderboard, and feedback (shared by both hosts)
- `src/worker.mjs` + `wrangler.jsonc`: Cloudflare host (static files plus one Durable Object for storage)
- `netlify/functions/api.mjs` + `netlify.toml`: Netlify host (Netlify Blobs for storage)
- `test/`: server tests (`npm test`)

## How it runs

The same code runs on Cloudflare Workers or Netlify. Each host builds from this repo on every push to `main`.

- Cloudflare: build command `npm install`, deploy command `npx wrangler deploy`.
- Netlify: settings come from `netlify.toml`.

Feedback is saved by the game's own server. To read it in the game, add your username to `ADMIN_USERS` (in `wrangler.jsonc` for Cloudflare, or as an environment variable on Netlify), then use the Admin inbox button. It has three tabs: feedback, question reports, and question health (miss rates).

## Scoring

Only level rounds count toward the leaderboard. Each correct answer earns 10 × the level, plus up to 50% for speed (fades over 20 seconds, none under 1 second) and up to 40% for a streak within the round. Clearing a level (4 of 5) adds 20 × the level. The server checks every answer and times each question.

## Editing questions

Questions live in `public/bank.js` (the original set) and `public/bank-v5.js` (V5 additions: wrong-answer notes, new questions, and rewrite drills). Each level has 45 questions. Each multiple-choice question is `[prompt, [4 options], index of the right option, explanation]`. Every question needs a skill tag; the tag strings sit in `SK` below the questions.

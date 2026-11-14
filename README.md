# Proseidon

Climb ten levels of English, from parts of speech to PhD. Live at https://proseidonpath.netlify.app

## What's here

- `public/`: the game (index.html, app.js) and the shared question bank (bank.js)
- `netlify/functions/`: the server for accounts, scored rounds, and the leaderboard
- `test/`: server tests (`npm test`)

## How it runs

Netlify builds from this repo on every push. The server stores players and scores in Netlify Blobs, with no outside database. Feedback arrives through Netlify Forms.

## Scoring

Only level rounds count toward the leaderboard. Each correct answer earns 10 × the level, plus up to 50% for speed (fades over 20 seconds, none under 1 second) and up to 40% for a streak within the round. Clearing a level (4 of 5) adds 20 × the level. The server checks every answer and times each question.

## Editing questions

All questions live in `public/bank.js`. Each multiple-choice question is `[prompt, [4 options], index of the right option, explanation]`. Every question needs a skill tag; the tag strings sit in `SK` below the questions.

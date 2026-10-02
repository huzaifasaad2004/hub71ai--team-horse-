# BRIDGE

A personal Abu Dhabi dashboard with flexible household setup, food and area preferences, Google Maps discovery, voice input, weekly planning and earned badges.

This repository runs native Next.js on Vercel. Visitors can explore the fictional sample and create a plan. Google sign-in unlocks live APIs and saved plans. Account data and household plans use Neon PostgreSQL. Save my plan persists the current household, choices, draft, favourites and progress; signing in restores the saved plan. Google place IDs are saved, while venue details are refreshed rather than stored.

## Run

Use Node 24 and npm. Copy `.env.example` to `.env.local` and fill server credentials locally. Never commit real values.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Local URL: http://127.0.0.1:5173. Run database migrations with `DATABASE_URL` set: `npm run db:migrate`.

## Deploy and Google login

Import this repository to Vercel with the Next.js preset and root directory `./`. Configure the variables in `.env.example` in the Production environment. The Google OAuth Web application callback must exactly match `BETTER_AUTH_URL` plus `/api/auth/callback/google`. See [GOOGLE_SETUP.md](GOOGLE_SETUP.md). The OAuth client is separate from the Places API key.

Better Auth verifies sessions on the server. Household reads and writes use the verified account ID, never a client-supplied owner ID. Saves use a version check to prevent another device’s changes from being overwritten. Live provider requests require sign-in and have persistent daily per-user limits: 10 AI requests, 10 transcriptions, 50 Maps searches or saved-place refreshes. Voice uploads are capped at 3 MB and recordings stop after 90 seconds.

Audio and optional stories are sent to OpenAI only when requested and are not retained by BRIDGE. Social discovery uses explicit interests and dislikes; social profile links do not authorize reading feeds. Area guides have no live housing prices. Introduction drafts are never sent automatically. Real Google OAuth round-trip verification requires the production OAuth credentials and a user sign-in.

## Current public release

Public URL: https://hub71ai-team-horse.vercel.app

Email and password signup is enabled. Google login is optional and deferred. The Abu Dhabi assistant supports three guest questions per network per day, with a persistent shared cap of 50 guest questions daily. Signed-in users share the ten daily planner requests. Password resets and email verification need an email provider before they can be enabled.

The family plan prioritises partner careers and friendships, children’s settling-in routines, and practical preparation before arrival. Plans and completion are saved explicitly to the signed-in user’s account.

The public root URL is the introductory family relocation landing page. The application is at /dashboard; /dashboard?start=1 starts a blank household, and /dashboard?signup=1 opens email signup.

# BRIDGE

A personal Abu Dhabi relocation dashboard. This redesign replaces the original long forms and linear text-heavy flow with a working dashboard, three short setup steps, discovery tabs, a weekly board and a compact introduction editor.

## What works now

- Flexible household editor: up to 20 people, including multiple partners and children. Names/nicknames are the only required typed fields. Adult goals, interests and things to avoid use multiselect chips with custom entries.
- Food tastes, dietary preferences, dislikes, dining budget, neighbourhood vibes, transport and settling-in availability.
- Deterministic personalization from explicit choices, without requiring AI credentials. Area ranking shows the actual matching tags, never a fabricated suitability score. Source-backed education cards retain original links.
- Dashboard with licensed photography, an SVG brand mark, real completion rings and track bars. XP and earned badges reflect completed preparation tasks, not wellbeing or relocation readiness.
- Weekly board, preparation-minute chart, completion controls, lighter schedule and completion preservation.
- Saved steps, places and areas, accessible detail dialogs, editable introductions and copy, draft replacement confirmation, preparation checklist and session reset.
- Microphone recording, 90-second stop, playback and download in compatible localhost/HTTPS browsers. Audio uploads only when Use voice note is selected. Transcription adapter needs server configuration; hardware recording was not tested by the agent on the user's microphone.
- Public Etihad career retrieval and ADEK education source retrieval; Cultural Foundation is a manually checked guide. Career coverage is one employer.
- Google Maps search handoff works without a key. Server Google Places Text Search adapter returns genuine live names, addresses, ratings and Maps links when `GOOGLE_PLACES_API_KEY` is configured. Missing keys and provider failures produce an honest unavailable state. No live Places call has been verified with a real credential.
- Social discovery uses adult interests and avoidance preferences. Optional social profile links stay in the session; no social account is connected and no private feeds are read. Recommendations from social-media content remain pending a supported provider connection.

The first dashboard contains a clearly labeled fictional sample household. Make it mine starts your own household. Choices invalidate derived plans; rebuild from the last setup step or dashboard. Refresh resets the session. No account database or cross-device persistence is implemented.

## Run and check

Use the original npm lockfile and Node 22.13+:

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Local development URL: http://127.0.0.1:5173/. The temporary task-local npm CLI and Codex bundled Node are documented in the handoff. The app remains a Vinext/React/Cloudflare Worker project; GitHub Pages alone cannot run its server endpoints.

Fourteen domain tests cover sample contracts, reference integrity, source validation/failure/cache behavior, stale-state invalidation, AI repair boundaries, flexible households, preference-driven area matching, personalized templates, and mocked Google Places normalization. Browser QA includes five-person custom setup with two partners/two children, custom food chips, neighbourhood changes, week completion/lighter mode, mobile layouts, dialogs, draft edit/copy, saves and the missing-key discovery state. Test results and publication status are recorded in `../HANDOFF.txt`.

## Connections

See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for Google Cloud setup. Maps/Places and Google login are separate capabilities. The current Sites starter supports platform-owned ChatGPT sign-in, not app-owned external Google OAuth. Google login has not been enabled. Its account panel says setup is needed; no fake signed-in identity is created.

Server runtime values, only through supported secret configuration:

| Value | Purpose |
| --- | --- |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) live restaurant and social-space discovery |
| `OPENAI_API_KEY` | Optional AI story reading and voice transcription |
| `OPENAI_MODEL` | Account-supported Responses structured outputs model |
| `OPENAI_TRANSCRIPTION_MODEL` | Account-supported transcription model |

Model names and keys are not guessed. The existing four structured AI adapters are preserved; the new dashboard uses local choice-based planning and editable templates by default. Never commit real keys or send them through chat. Example keys in `.env.example` are blank.

## GitHub and publication

Requested repository: https://github.com/huzaifasaad2004/hub71ai--team-horse-.git. The CI template in `docs/ci-template.yml` checks TypeScript, tests and the Worker build. The existing GitHub token has repository access but no workflow scope, so the template is not installed as an active workflow. See the handoff for push status and branch; do not claim source is published until a remote SHA has been checked.

Reuse the existing private Sites identity in `.openai/hosting.json`: `appgprj_6abf4fd5d16081919c3bd18d70db1bb3`. Do not register another site. Sites publication uses the bundled `site-workflow.mjs` with fresh credentials passed through hidden stdin, followed by native private deployment and terminal status verification. GitHub source publication does not itself deploy the Worker or configure Google login.

## Data and imagery

Personal details remain in memory. Public career/education summaries alone use isolate-local caches retaining original fetch timestamps. Places responses are not durably cached. Discovery and audio endpoints enforce same-origin browser requests, bounded bodies and isolate concurrency limits. Global quota controls belong to the hosting/provider configuration.

Licensed source photographs are served from Wikimedia and credited in the UI. Skyline: giggel, CC BY 3.0. Saadiyat beach: Florian Kriechbaumer, CC BY-SA 4.0. Louvre canopy: Francisco Anzola, CC BY 3.0. Coffee still life: Pixabay, CC0; representative rather than a named local venue. Photographs are cropped by CSS, and the beach adaptation remains under CC BY-SA 4.0. No generated photos are used.

Privacy and terms information is available at `/privacy` and `/terms`. Drafts remain draft-only; there are no emails, applications, bookings or government submissions.

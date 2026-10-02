# Google setup for Vercel

Project: BRIDGE (`bridge-510409`).

1. Enable Places API (New) and keep its API key in the Vercel server variable `GOOGLE_PLACES_API_KEY`.
2. Open Google Auth Platform and complete Branding, Audience (External), and developer contact details. Use only the basic OpenID email/profile scopes.
3. In Clients, create an OAuth client, application type Web application, named BRIDGE Vercel.
4. Add the actual public BRIDGE URL as an authorized JavaScript origin. Add that URL plus `/api/auth/callback/google` as an authorized redirect URI. URLs must match exactly. Local development can also use `http://127.0.0.1:5173/api/auth/callback/google`.
5. Download the client JSON. Keep it private. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as server-only Vercel variables, alongside `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `DATABASE_URL`. Do not use NEXT_PUBLIC names for secrets.
6. If Google’s audience is in Testing, add intended testers. For public use, publish the OAuth audience according to Google’s displayed requirements.
7. Redeploy and verify Continue with Google, account identity, save, sign out, and restore after signing in.

Primary documentation: [Google OAuth web server apps](https://developers.google.com/identity/protocols/oauth2/web-server), [Better Auth Google provider](https://better-auth.com/docs/authentication/google), [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies).

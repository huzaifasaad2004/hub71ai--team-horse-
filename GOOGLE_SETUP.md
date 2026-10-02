# Google setup for BRIDGE

Google Maps search links work now. Live Places results and Google account login are separate integrations; enabling one does not enable the other.

## Live restaurants and social spaces

1. Open https://console.cloud.google.com/projectcreate in your own Google account. Create a project named BRIDGE, or select an existing project.
2. Link a billing account, after checking Google's Maps pricing. Creating the app does not authorize this agent to accept payment terms or spend money on your behalf.
3. Enable **Places API (New)** in APIs & Services → Library.
4. Create an API key. Restrict the key to Places API (New); use an appropriate server/network application restriction for your eventual hosting provider. Do not use a browser referrer restriction for this server-only API key.
5. Set `GOOGLE_PLACES_API_KEY` through the hosting provider's secret configuration. For local development only, use ignored `.env`. Do not paste keys into chat, source, GitHub issues or client code.
6. Set a budget alert and quota suitable for the demo. Alerts do not automatically cap spending.
7. Restart the local server or publish the configured runtime. Open Discover, choose a cuisine or interest, and select Find places. Verify genuine Google Maps results and attribution. Check diets/allergies directly with venues.

The app calls the documented fixed `places:searchText` endpoint, scopes the search rectangle around Abu Dhabi, requests six results, and displays provider-returned names, ratings and links. Google results are not permanently cached. It never claims Maps results are live when the key is missing.

Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
Policies: https://developers.google.com/maps/documentation/places/web-service/policies

## Google login

The current Sites authentication path is platform-owned ChatGPT sign-in. Its supported starter workflow does not provide app-owned external Google OAuth. A Google button that silently creates a local session would not be real authentication, so this build clearly labels Google sign-in as awaiting setup.

Before creating a Google OAuth client, choose a deployment that supports Google sign-in, such as a Firebase Authentication project with a compatible app backend, or confirm a supported external identity path on the eventual host. Configure a web application client with the exact final production origin and the provider's documented callback URL; never guess the callback or use the unverified Sites URL as a completed deployment. Configure account persistence and server-side token verification as part of that integration.

Google OAuth credentials must remain in their intended public-client/server-secret locations. Enabling Google login requires an authorized configuration step; it is not completed in this build.

## Voice notes

Recording, playback and download work locally in a compatible HTTPS/localhost browser after microphone permission. Use voice note explicitly uploads audio. To transcribe it, configure `OPENAI_API_KEY` and `OPENAI_TRANSCRIPTION_MODEL` on the server. No transcription model is guessed, and no recording is sent until the user presses Use voice note. The recorder stops at 90 seconds; uploads over 5 MB are rejected.

# Cloudflare Stream Setup for 97% Gold

The project runs its React app and `/api` functions on Vercel, uses Firebase Authentication and Firestore for membership, and uses Cloudflare Stream for live video. Any signed-in user can watch the live stream and replays. Optional upcoming-session announcements remain available only to active or trial members whose subscription has not expired.

TradingView alerts do not create video. Use OBS to capture your TradingView chart and commentary and broadcast that video to Cloudflare. The live state and replay list are discovered automatically from the Cloudflare live input; Firestore is only used for optional upcoming-session announcements.

## 1. Confirm the Cloudflare API token

The `97gold-stream-playback` token shown in the dashboard should be scoped to this Cloudflare account with **Stream Read** and **Stream Write** only. This is sufficient for the one-time setup script and for the live-status endpoint. Do not add DNS or Workers permissions.

The token secret is shown only at token creation. If you no longer have the secret, create a replacement token and revoke the lost one. Never paste the token into chat, React code, Git, or a `REACT_APP_` variable.

## 2. Run the one-time setup script

The script creates a live input with automatic recordings and signed playback enabled, then creates a Stream signing key. It prints the RTMPS input credentials for OBS and the remaining environment-variable values for Vercel.

The project now has a git-ignored `.env.local` with your account ID and customer code. After revoking the token that was pasted into chat and creating a replacement, open `.env.local` locally and put the new secret after `CLOUDFLARE_STREAM_API_TOKEN=`. Do not send the replacement token in chat.

From PowerShell in the project root, run the setup script with Node's env-file option:

```powershell
node --env-file=.env.local scripts/setup-cloudflare-stream.mjs
```

The default allowed origins are `oferwaron97gold.vercel.app` and `localhost:3000`. If you use a custom domain, set `ALLOWED_ORIGINS` before running the script, with comma-separated hostnames (no `https://`):

```powershell
$env:ALLOWED_ORIGINS = "oferwaron97gold.vercel.app,your-domain.example,localhost:3000"
```

The script writes the RTMPS server/key and signing-key values to the terminal. Save the signing key securely; Cloudflare will not display it again. Never send either key to members or commit them to the repository.

If you already created an input, set `CLOUDFLARE_LIVE_INPUT_UID` before running to update it instead of creating another. Set `SKIP_SIGNING_KEY=1` only if you already have the corresponding signing key saved.

## 3. Configure Vercel environment variables

Open **Vercel → Project → Settings → Environment Variables**. Add the values printed by the setup script:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`
- `CLOUDFLARE_LIVE_INPUT_UID`
- `CLOUDFLARE_STREAM_CUSTOMER_CODE` (the part after `customer-` in a Stream player URL)
- `CLOUDFLARE_SIGNING_KEY_ID`
- `CLOUDFLARE_SIGNING_KEY_PEM`

Also set Firebase Admin credentials for the Vercel API functions:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Reuse existing values if those Firebase variables already exist in Vercel. Paste the private key in the Vercel secret field; it may be stored with literal `\n` sequences, which the server helper expands. Set variables for Preview and Production as needed, then redeploy.

The Cloudflare token is used by the setup script and to read current/replay status. Playback URLs are signed locally with the signing key, so `/api/stream-token` does not call Cloudflare for every viewer. After setup is complete, you can replace the token with a **Stream Read-only** token; the setup script needs Stream Write only when creating/updating the input or creating a signing key.

For local testing, keep these settings in the ignored `.env.local`. After the setup script creates the live input and signing key, add its `CLOUDFLARE_LIVE_INPUT_UID`, `CLOUDFLARE_SIGNING_KEY_ID`, and `CLOUDFLARE_SIGNING_KEY_PEM` values there as well as in Vercel. Do not store the OBS stream key in this project; enter it only in OBS. Vercel API functions are not served by `npm start`; run them with `npx vercel dev`.

## 4. Configure OBS and test

1. Install OBS Studio.
2. Open **Settings → Stream**, choose **Custom**, and enter the RTMPS server and stream key printed by the setup script.
3. Add a capture of your TradingView window and microphone audio if needed. Hide private account details before broadcasting.
4. Start streaming and confirm Cloudflare's live preview is correct.
5. Open `/live` while signed in. The page polls every 20 seconds and should show **Live now** automatically.
6. Stop the broadcast. After Cloudflare finishes preparing the recording (usually about a minute), it appears under **Past sessions** automatically.

## 5. Add upcoming-session announcements (optional)

Create a document in **Firebase Console → Firestore Database → Data → `streamEvents`** with:

| Field | Type | Example |
| --- | --- | --- |
| `title` | string | `97% Gold Strategy Live` |
| `description` | string | `TradingView strategy walkthrough and Q&A` |
| `startsAt` | timestamp | Scheduled date and time |
| `status` | string | `scheduled` |

The page shows scheduled documents in the upcoming section. It does not need documents for live broadcasts or replays; those come from Cloudflare automatically. Only the owner can write these documents in Firebase Console.

## 6. Security and troubleshooting

- Both `/api/stream-status` and `/api/stream-token` verify the Firebase ID token server-side. Any signed-in user can access live playback and replays.
- The Firestore rules allow active members to read the optional schedule and deny client writes. Deploy them from the project root with `firebase deploy --only firestore:rules`.
- The player URL is a bearer link valid for one hour and can be shared until it expires. Allowed origins restrict which websites can embed it, but do not bind playback to an individual member.
- If the status endpoint returns an authorization error, confirm the API token has **Stream Read**. If setup fails creating a live input/signing key, confirm it also has **Stream Write**.
- If playback fails, verify `CLOUDFLARE_STREAM_CUSTOMER_CODE`, `CLOUDFLARE_SIGNING_KEY_ID`, and `CLOUDFLARE_SIGNING_KEY_PEM` match the same Cloudflare account and saved signing key.
- If the API token or OBS stream key was exposed, rotate it in Cloudflare and update the relevant environment variable.

Cloudflare references: [Start a live stream](https://developers.cloudflare.com/stream/stream-live/start-stream-live/), [Watch a live stream](https://developers.cloudflare.com/stream/stream-live/watch-live-stream/), and [Secure your Stream](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/).
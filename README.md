# PrivateLens

Local-first AI privacy gateway built as a React + Vite web app for the #BuildHybridAI concept.

## Current runnable prototype

- React/Vite UI
- Login flow with a Firebase Auth adapter (prototype auth works without credentials)
- Local privacy scan adapter with PII redaction simulation
- Sanitized-content-only cloud analysis adapter simulation
- AI execution trace showing local vs cloud routing
- Local browser persistence for scan metadata and sanitized content only
- No original sensitive text is persisted
- Firestore-ready repository boundary

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Firebase Auth

1. Copy `.env.example` to `.env.local`.
2. Create/configure a Firebase web app and enable Google sign-in.
3. Fill the `VITE_FIREBASE_*` values.
4. Set `VITE_USE_FIREBASE_AUTH=true`.
5. Restart Vite.

Until then, the login button intentionally uses prototype authentication so the app remains runnable.

## Firebase AI Logic integration point

`src/services/aiService.js` is the adapter boundary. Replace `scanLocally()` and `analyzeSanitized()` with Firebase AI Logic hybrid inference calls. The UI and execution trace do not need to be redesigned.

The current adapter is explicitly marked as simulated in the UI so the prototype does not falsely claim real Gemini Nano/cloud execution.

## Firestore later

`src/services/scanRepository.js` exposes a small repository contract. Add a Firestore implementation with the same methods and switch the exported repository. Do not persist original sensitive content by default.

## Production checklist

- Firebase App Check
- Firebase AI Logic Hybrid Inference
- Real local-model availability state
- Firebase Auth
- Optional Firestore repository
- Error/retry handling
- Hosted deployment

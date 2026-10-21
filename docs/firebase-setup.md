# Firebase setup

TownSync runs without Firebase out of the box. This guide explains how to switch the
application to a real Firebase backend.

---

## 1. Create the project

1. Open the [Firebase console](https://console.firebase.google.com) and create a project.
2. Add a **Web app** (`</>` icon) and copy the configuration object.
3. Note the project id, auth domain, storage bucket and app id.

---

## 2. Enable the services

| Service | Path | Required |
| --- | --- | --- |
| Authentication | Authentication → Sign-in method → Email/Password | Yes |
| Cloud Firestore | Firestore Database → Create database | Yes |
| Cloud Storage | Storage → Get started | Recommended (photo evidence) |
| Hosting | Hosting → Get started | Only for deployment |

---

## 3. Configure the environment

```bash
cp .env.example .env.local
```

Fill in the values from the Firebase console:

```dotenv
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=townsync-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=townsync-demo
VITE_FIREBASE_STORAGE_BUCKET=townsync-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

Never commit `.env.local` — it is ignored by git. To keep using the local demo data while a
Firebase project exists, set:

```dotenv
VITE_FORCE_DEMO_MODE=true
```

Restart the dev server after editing the environment file.

---

## 4. Deploy the security rules

The repository ships `firestore.rules`, `storage.rules`, `firestore.indexes.json` and
`firebase.json`.

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # select the project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The rules read the role from the user profile document, so seed the `users` collection before
inviting real accounts.

---

## 5. Seed the data

Create a `users` collection and add one document per account. The document id **must** match
the Firebase Auth uid.

```json
{
  "name": "Ir. Farhan Ismail",
  "email": "admin@townsync.demo",
  "role": "admin",
  "points": 0,
  "block": "Township Office",
  "joinedAt": "2025-01-10T00:00:00.000Z"
}
```

Valid `role` values are `resident`, `maintenance`, `operator` and `admin`.

Register the matching accounts in Authentication → Email/Password using the same emails.

### Optional: seed the township dataset

The Firestore repository reads the collections listed in `docs/architecture.md`. To replicate
the demo dataset, export the seed from `src/data/seed.ts` and write one document per record
using the record id as the document id. Because `readAll()` reads the whole collection
without filters, every field must be present.

---

## 6. Storage buckets

Photo evidence is stored under `users/{userId}/` and `reports/{reportId}/`. The storage rules
limit uploads to 10 MB and restrict reads to the owner and staff.

---

## 7. Switching back to demo mode

Set `VITE_FORCE_DEMO_MODE=true` in `.env.local` and restart the dev server. The demo session
key (`townsync.session`) is independent of Firebase, so signing in with a demo account never
touches the Firebase project.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The app always starts in demo mode | A Firebase variable is missing | Compare `.env.local` with `.env.example`. |
| `PERMISSION_DENIED` on reads | Rules not deployed, or the `users` document is missing | Run `firebase deploy --only firestore:rules` and seed `users`. |
| `PERMISSION_DENIED` on writes | The signed-in user's role does not allow the write | Check the `role` field on the profile document. |
| `auth/invalid-credential` | Email/password sign-in is disabled | Enable Email/Password in Authentication. |
| Storage upload fails | Cloud Storage not enabled | Enable it, or accept the demo-only image flow. |

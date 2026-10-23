# Setting up the services

The web app already works without any accounts. It runs on GitHub Pages, works offline, and saves progress on each device. Each service below adds one thing, and each takes about 5 minutes. **You create the accounts yourself** (they need your email, password and identity checks). After that, the commands below connect everything.

| Service | What it adds | Cost |
|---|---|---|
| Cloudflare Pages | Faster hosting in India, unlimited bandwidth, custom domain | Free |
| Cloudflare R2 | Image storage outside the code repository (when media grows) | Free up to 10 GB |
| Firebase Auth + Firestore | Sign-in with Google; progress, XP and streak synced across devices | Free (Spark plan) |
| Domain (optional) | e.g. `axomrank.in` | About ₹800 per year |

---

## 1. Cloudflare Pages (hosting)

1. Create a free account at https://dash.cloudflare.com/sign-up and verify your email.
2. On this computer, sign the command-line tool in to your account (a browser window opens; approve it):
   ```bash
   npx wrangler@3 login
   ```
3. Create the project once:
   ```bash
   npx wrangler@3 pages project create ahom-lessons --production-branch main
   ```
4. Deploy. This checks the content, then uploads only the website files:
   ```bash
   scripts/deploy_cloudflare.sh
   ```
   The app is then live at `https://ahom-lessons.pages.dev`.
5. (Optional) Custom domain: Cloudflare dashboard → Workers & Pages → ahom-lessons → Custom domains.

**Updates:** after changing a lesson, run `scripts/deploy_cloudflare.sh` again.

## 2. Cloudflare R2 (images), when you need it

Images can stay in the repository for now (about 2 MB for 2 lessons). Move them to R2 when the media grows past a few hundred MB, or when you add audio.

1. Cloudflare dashboard → R2 → turn on R2. A payment card may be asked for verification; the free tier is not charged.
2. Create a bucket named `axomrank-media`, then turn on **Public access** (r2.dev URL or your own domain, e.g. `media.axomrank.in`).
3. Bucket → Settings → CORS policy, allow your site to read images for offline downloads:
   ```json
   [{ "AllowedOrigins": ["https://ahom-lessons.pages.dev", "https://axomrank.github.io"], "AllowedMethods": ["GET"], "AllowedHeaders": ["*"] }]
   ```
4. Upload the images:
   ```bash
   scripts/upload_media_r2.sh axomrank-media
   ```
5. In `app/config.js`, set `mediaBase` to the bucket's public URL (ending with `/`), then deploy.

## 3. Firebase (sign-in + progress sync)

1. Go to https://console.firebase.google.com and sign in with a Google account → **Add project** → name it, e.g. `axomrank-app`. Google Analytics is optional.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   - Authentication → Settings → **Authorized domains** → add `axomrank.github.io` and `ahom-lessons.pages.dev` (and your domain later).
3. **Build → Firestore Database → Create database → Production mode**, location `asia-south1 (Mumbai)`.
4. **Project settings (gear) → Your apps → Web (`</>`)** → register an app called "web". Firebase shows a `firebaseConfig` object. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `app/config.js`:
   ```js
   firebase: { apiKey: "…", authDomain: "axomrank-app.firebaseapp.com", projectId: "axomrank-app", appId: "…" },
   ```
   These values are not secrets. Firebase web keys are meant to be public; the security rules protect the data.
5. Publish the security rules (each learner can read and write only their own document):
   ```bash
   npx firebase-tools@13 login
   npx firebase-tools@13 deploy --only firestore:rules --project axomrank-app
   ```
6. Deploy the site. A person icon appears at the top right of the course home; learners tap it to sign in with Google.

**What is stored:** one document per learner at `users/{uid}` with `xp`, `streak`, finished units per lesson, and mistakes to revise. Nothing else.

**Free-plan limits (check the console for current numbers):** 50,000 document reads and 20,000 writes per day. The app writes at most once every few seconds while a learner is active, which supports a few thousand daily learners.

---

## After that: Android and iOS

The same web app becomes store apps with Capacitor:

```bash
npm init -y && npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Ahom Kings" in.axomrank.ahom --web-dir dist
```

- Google Play developer account: $25 once.
- Apple developer account: $99 per year (needed for the App Store and TestFlight).
- Google sign-in inside the native apps needs the `@capacitor-firebase/authentication` plugin, because pop-up sign-in only works in browsers.

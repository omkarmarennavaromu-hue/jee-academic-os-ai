# Deploying JEE Academic OS to Vercel

## Repo structure check (the #1 cause of "page not found")
After uploading to GitHub, the ROOT of the repo must directly contain:
  package.json · index.html · vite.config.js · vercel.json · api/ · src/ · public/
If instead your repo root shows ONE folder (e.g. "jee-os/" or "JEE-OS-source/")
with everything inside it, Vercel builds nothing and you get 404.
Fix: move all files up to the repo root, or in Vercel → Settings → General →
"Root Directory" → set it to that folder name.

## Steps
1. Push this whole folder's CONTENTS to a GitHub repo (files at root level).
2. vercel.com → Add New → Project → Import the repo.
3. Framework Preset should auto-show "Vite". If not, set:
     Build Command:    npm run build
     Output Directory: dist
4. Environment Variables (BEFORE deploying):
     OPENROUTER_API_KEY = sk-or-v1-...      (required for AI)
     ACCESS_CODE        = any-secret-word   (optional, recommended)
   See .env.example — do NOT commit a real .env file.
5. Deploy. Open the URL.
6. In the app: AI Coach → "Use server key" (+ your access code if set).

## Verifying
- https://YOUR-APP.vercel.app            → the app loads
- https://YOUR-APP.vercel.app/api/models → JSON (or 401 if ACCESS_CODE set) = API working

## If you see 404 NOT_FOUND
- Repo root nested in a folder → fix Root Directory (see above)
- Output Directory not "dist"  → fix in Settings → Build & Development
- Build failed → check the deployment's "Build Logs" tab, send me the error

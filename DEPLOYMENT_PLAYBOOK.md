# DevSync — Zero-Cost Production Deployment Playbook (Netlify + Render + GitHub Student Pack)

This playbook provides the step-by-step execution manual to deploy **DevSync** for **$0/month (Lifetime Free Tier)** using a **Split Edge-Proxy Architecture**:
- **Frontend CDN & Reverse Proxy:** **Netlify** (serves the React 19 + Vite static bundle from `dist/` and proxies `/api/*` and `/auth/callback*` at the edge).
- **Backend API Server:** **Render.com Free Web Service** (runs the Node.js Express server in `server.ts`, managing Octokit, LRU caches, Gemini AI setup guides, and AES-256-GCM encrypted OAuth sessions).
- **Custom Domain & TLS:** **GitHub Student Developer Pack** (`.tech`, `.me`, or `.live` domain with automatic Let's Encrypt HTTPS).

---

## Phase 1: Local Preparation & Build Configuration

### 1.1 `package.json` Scripts Verification
Your `package.json` is already configured with the exact production scripts required by both Netlify and Render:

```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "NODE_ENV=production tsx server.ts",
    "test": "tsx --test src/utils/matchingEngine.test.ts",
    "lint": "tsc --noEmit"
  }
}
```
- **Why `tsx` is in `dependencies` (not `devDependencies`):** Render runs `npm start` (`NODE_ENV=production tsx server.ts`). Keeping `tsx` in `"dependencies"` guarantees the runtime TypeScript executor is always available in production containers.
- **Dynamic Port Binding:** `server.ts` binds to `const PORT = Number(process.env.PORT) || 3000;` on `0.0.0.0` and enables `app.set('trust proxy', 1);` so `Secure` cookies and rate-limiting client IPs work accurately behind Render and Netlify proxies.

### 1.2 `netlify.toml` (Included in Repository Root)
To prevent cross-origin CORS errors and browser third-party cookie drops (`SameSite` restrictions), **do not** force the browser to make cross-domain requests from `netlify.app` to `onrender.com`. Instead, `netlify.toml` uses **Netlify Edge Rewrite Rules (`status = 200`)** so the browser talks exclusively to your Netlify domain:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/api/*"
  to = "https://devsync-api.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/auth/callback*"
  to = "https://devsync-api.onrender.com/auth/callback:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 1.3 Push Your Codebase to GitHub
Run these commands in your local project terminal:

```bash
# Verify zero TypeScript or build errors before pushing
npm run lint
npm run build

# Initialize Git (if not already initialized) and push to your personal GitHub repo
git init
git add .
git commit -m "chore(deploy): add production netlify.toml and render.yaml configurations"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/devsync.git
git push -u origin main
```

---

## Phase 2: Backend Deployment (Render.com Free Tier)

1. Sign in to **[dashboard.render.com](https://dashboard.render.com)** using your GitHub account.
2. Click **New +** (top right) → Select **Web Service**.
3. Under **Build and deploy from a Git repository**, select your `<YOUR_GITHUB_USERNAME>/devsync` repository and click **Connect**.
4. Configure the Web Service settings:
   - **Name:** `devsync-api` (this produces the URL `https://devsync-api.onrender.com`)
   - **Region:** Choose the region closest to your users (e.g., `Singapore (Southeast Asia)`, `Frankfurt (EU Central)`, or `Oregon (US West)`).
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Select **Free ($0/month)**.
5. Scroll down to **Environment Variables** and click **Add Environment Variable** for each of the following keys:

| Key | Value to Enter | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production static/API optimizations. |
| `SESSION_SECRET` | Run `openssl rand -hex 32` locally and paste the 64-char hex string | Key for AES-256-GCM OAuth cookie encryption and HMAC CSRF tokens. |
| `GEMINI_API_KEY` | Your Google AI Studio Gemini API Key | Powers `/api/ai/analyze-setup` live repository onboarding guides. |
| `GITHUB_TOKEN` | Your GitHub Personal Access Token (`ghp_...` with `public_repo`, `read:user`) | Raises backend GitHub rate limit from 60 req/hr to 5,000 req/hr + GraphQL telemetry. |
| `GITHUB_CLIENT_ID` | Your GitHub OAuth App Client ID | Used by `/api/auth/url` and `/auth/callback`. |
| `GITHUB_CLIENT_SECRET` | Your GitHub OAuth App Client Secret | Used by `/auth/callback` to exchange OAuth code for token. |
| `APP_URL` | `https://<your-site-name>.netlify.app` *(update to `https://yourdomain.tech` in Phase 5)* | Used to construct the OAuth `redirect_uri` and `postMessage` target origin. |
| `ALLOWED_ORIGINS` | `https://<your-site-name>.netlify.app,https://yourdomain.tech` | Explicit CORS allowlist for your frontend origins. |

6. Click **Create Web Service**.
7. Wait ~2 minutes for the build to finish. Copy your live Render URL (e.g., `https://devsync-api.onrender.com`) and verify it responds at:
   `https://devsync-api.onrender.com/api/health`

---

## Phase 3: Frontend Deployment (Netlify CDN)

1. Open `netlify.toml` in your repository and ensure the `to = "https://devsync-api.onrender.com/..."` lines match the exact `.onrender.com` URL assigned to you in Phase 2. If your Render service name differed, update those two lines, commit, and `git push`.
2. Sign in to **[app.netlify.com](https://app.netlify.com)** with your GitHub account.
3. Click **Add new site** → **Import an existing project** → Choose **GitHub**.
4. Select your `<YOUR_GITHUB_USERNAME>/devsync` repository.
5. Netlify will automatically read `netlify.toml` and pre-fill:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. *(Optional)* Why no frontend API keys are needed on Netlify:
   - Because all `/api/*` requests are proxied server-side by Netlify's Edge directly to Render (via `netlify.toml`), your React frontend uses relative paths (`fetch('/api/github/issues')`). **Never** place `GEMINI_API_KEY` or `GITHUB_CLIENT_SECRET` in Netlify environment variables!
7. Click **Deploy <site-name>**.
8. Once deployed, click **Site configuration** → **Change site name** and set a clean subdomain (e.g., `devsync-platform.netlify.app`).
9. Test direct SPA navigation by opening `https://devsync-platform.netlify.app/learn` and `https://devsync-platform.netlify.app/api/health` in your browser—both will return `HTTP 200`.

---

## Phase 4: GitHub OAuth Production Configuration

Because `netlify.toml` proxies `/auth/callback*` from your Netlify domain directly to your Render backend, your OAuth callback URL lives on your **frontend domain**! This guarantees the `devsync_oauth_session` cookie is set first-party on your frontend domain.

1. Go to **[GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)**.
2. Click your **DevSync** OAuth App (or click **New OAuth App** if creating a dedicated production app).
3. Update the two URL fields to match your live frontend domain:
   - **Application name:** `DevSync — Open-Source Onboarding Platform`
   - **Homepage URL:**
     ```text
     https://devsync-platform.netlify.app
     ```
     *(Or `https://devsync.tech` once you complete Phase 5)*
   - **Authorization callback URL:**
     ```text
     https://devsync-platform.netlify.app/auth/callback
     ```
     *(Or `https://devsync.tech/auth/callback` once you complete Phase 5)*
4. Click **Update application**.
5. Go back to your **Render Dashboard** → `devsync-api` → **Environment**, and verify that `APP_URL` is set to the exact same origin (`https://devsync-platform.netlify.app`, with no trailing slash). Click **Save Changes**.

---

## Phase 5: Custom Domain Setup (GitHub Student Developer Pack)

Your GitHub Student Developer Pack includes free domains from **Namecheap** (`.me`), **Name.com** (`.live`, `.software`), and **.TECH** (`.tech`).

### 5.1 Claim Your Free Domain
1. Visit **[education.github.com/pack](https://education.github.com/pack)** and scroll to the **Namecheap**, **Name.com**, or **.TECH** offer.
2. Register your domain (for example, `devsync.tech` or `devsync.me`).

### 5.2 Attach the Domain to Netlify
1. In your **Netlify Dashboard**, select your DevSync site → Go to **Domain management** → Click **Add a domain**.
2. Type `devsync.tech` (your custom domain) → Click **Verify** → Click **Add domain**.
3. Configure DNS at your domain registrar (Namecheap / Name.com / .TECH) using **External DNS**:
   - **Apex Domain (`@` / `devsync.tech`):**
     - **Type:** `A` Record
     - **Host:** `@`
     - **Value:** `75.2.60.5` *(Netlify's global anycast load balancer IP)*
   - **WWW Subdomain (`www.devsync.tech`):**
     - **Type:** `CNAME` Record
     - **Host:** `www`
     - **Value:** `<your-site-name>.netlify.app`
4. Wait 5–15 minutes for DNS propagation. In Netlify **Domain management → HTTPS**, click **Verify DNS configuration** and Netlify will automatically provision a free **Let's Encrypt SSL/TLS certificate**.

### 5.3 Final Production Cutover Checklist
Once `https://devsync.tech` is active with HTTPS:
1. **Render Environment Variables:** Update `APP_URL` to `https://devsync.tech` and `ALLOWED_ORIGINS` to `https://devsync.tech,https://www.devsync.tech,https://<your-site-name>.netlify.app`.
2. **GitHub OAuth App:** Update **Homepage URL** to `https://devsync.tech` and **Authorization callback URL** to `https://devsync.tech/auth/callback`.

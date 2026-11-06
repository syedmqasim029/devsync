# DevSync Zero-Cost Cloud Deployment Playbook & Infrastructure Blueprint

Deliver a complete, production-ready deployment configuration and 5-phase operational playbook to host **DevSync** for $0/month (Lifetime Free Tier) using a **Split Edge-Proxy Architecture**: **Netlify** for the React 19 + Vite SPA frontend and **Render** for the Node.js Express API backend, unified under a free custom domain from the **GitHub Student Developer Pack**.

## User Review & Critical Decisions

> [!IMPORTANT]
> Your Phase 1 architectural preferences have been locked in below. Once you click **Proceed**, we will commit the production configuration files (`netlify.toml`, `render.yaml`, and `DEPLOYMENT_PLAYBOOK.md`) and provide the complete, copy-pasteable 5-phase execution manual.

- **Confirmed Decision 1 — Split Architecture (Netlify + Render)**: Host the static Vite build on Netlify's global CDN and the Express API server on Render's Free Web Service tier.
- **Confirmed Decision 2 — Netlify Edge Proxy (`netlify.toml`)**: Use Netlify status-200 reverse proxy rewrites for `/api/*` and `/auth/callback*` pointing to the Render backend URL. Because the browser only ever talks to your Netlify domain, `/api` requests and AES-256-GCM encrypted `httpOnly` OAuth cookies operate first-party on the same origin—completely eliminating cross-origin CORS failures and third-party cookie blocking.
- **Confirmed Decision 3 — Repository Configuration & Playbook**: Add the ready-to-deploy `netlify.toml`, `render.yaml`, and `DEPLOYMENT_PLAYBOOK.md` files directly to the project alongside any required `package.json` script refinements.

---

## 1. Overview & Core Concept

- **What It Does**: Prepares the DevSync repository for immediate one-click deployment to Netlify and Render, and documents every terminal command, configuration snippet, environment variable, OAuth callback setting, and DNS record required to go live.
- **Target Audience / Persona**: University student developers and founders moving DevSync from the development sandbox to a public, custom-domain production environment at zero cost.
- **Key Value**: Achieves global CDN performance for the React SPA while keeping API keys (`GEMINI_API_KEY`, `GITHUB_TOKEN`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`) 100% isolated on the server-side Render instance without CORS or cookie headaches.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Phase 1 (Local Build & Config Readiness)**: Developer pushes the repository containing the pre-configured `netlify.toml` and `render.yaml` blueprints to GitHub.
  2. **Phase 2 (Render Backend Provisioning)**: Render builds and launches the Express API server with zero-downtime health checks (`/api/health`) and encrypted environment variables.
  3. **Phase 3 (Netlify Frontend & Edge Proxy)**: Netlify builds the Vite SPA (`dist/`), proxies `/api/*` and `/auth/callback*` to Render, and serves client-side routes (`/learn`, `/feed`, `/mentorship`, `/portfolio/*`) via a status-200 SPA fallback rule.
  4. **Phase 4 (GitHub OAuth Production Handshake)**: Users sign in via the GitHub OAuth popup; the callback completes across the Netlify-to-Render proxy and posts `OAUTH_AUTH_SUCCESS` back to the opener window.
  5. **Phase 5 (Student Pack Custom Domain)**: Custom `.tech`, `.me`, or `.live` domain is attached to Netlify with automatic Let's Encrypt TLS certificates.
- **Visual Identity & Theme**:
  - Preserves the existing high-contrast light engineering aesthetic (`#FAFAFA` canvas, `#FFFFFF` surfaces, `#0A0A0A` display typography, `#2563EB` primary brand actions, `#DC2626` destructive/close controls, `#16A34A` verified badges, and `#D97706` caution callouts) with zero UI regressions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Netlify Edge Reverse Proxy vs. Direct Cross-Origin Fetch**
  - *Chosen Approach*: Route `/api/*` and `/auth/callback*` through Netlify's edge proxy (`status = 200` rewrite in `netlify.toml`) to `https://<your-service>.onrender.com`.
  - *Why*: Browsers increasingly block third-party cookies (`SameSite=None`) across different domains (e.g., `netlify.app` calling `onrender.com`). Proxying `/api/*` at the Netlify edge makes every API call and OAuth session cookie first-party on the frontend domain without modifying a single `fetch('/api/...')` call in the React codebase.
  - *Alternatives Considered*: Rewriting all frontend `fetch()` calls to prepend `VITE_API_BASE_URL` and relying on cross-origin cookies. Rejected because Safari ITP and Chrome third-party cookie restrictions break cross-domain OAuth cookies.
- **Decision 2 — CORS & Allowed Origins Defense-in-Depth**
  - *Chosen Approach*: Update the backend CORS allowlist and `APP_URL` / `ALLOWED_ORIGINS` handling so both `.netlify.app` domains and custom Student Pack domains (`.tech`, `.me`, `.live`) are trusted alongside `localhost:3000` and `.run.app`.
  - *Why*: Ensures both proxied requests and direct health checks succeed seamlessly.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Request Routing Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   STUDENT / RECRUITER BROWSER                              │
│          https://devsync.tech  (or https://devsync.netlify.app)            │
└───────────────┬────────────────────────────────────────┬───────────────────┘
                │                                        │
   1. Static & SPA Routes                   2. API & OAuth Requests
   (/, /feed, /learn, /mentorship)          (/api/*, /auth/callback)
                │                                        │
                ▼                                        ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│      NETLIFY GLOBAL EDGE CDN          │  │   NETLIFY EDGE REVERSE PROXY    │
│  • Serves Vite bundle from dist/      │  │   (netlify.toml status = 200)   │
│  • /* -> /index.html (200 SPA rule)   │  │   Forwards request & cookies    │
└───────────────────────────────────────┘  └─────────────────┬───────────────┘
                                                             │
                                                             ▼
                                           ┌─────────────────────────────────┐
                                           │   RENDER FREE WEB SERVICE       │
                                           │   (Node.js Express Backend)     │
                                           │  • /api/github/* (Octokit + LRU)│
                                           │  • /api/ai/analyze-setup        │
                                           │  • /api/auth/* & /auth/callback │
                                           │  • Secrets: GEMINI_API_KEY,     │
                                           │    GITHUB_TOKEN, SESSION_SECRET │
                                           └─────────────────┬───────────────┘
                                                             │
                                        ┌────────────────────┴───────────────┐
                                        ▼                                    ▼
                           ┌─────────────────────────┐          ┌────────────────────────┐
                           │  GitHub REST & GraphQL  │          │   Google Gemini API    │
                           │    + GitHub OAuth 2.0   │          │   (Server-Side SDK)    │
                           └─────────────────────────┘          └────────────────────────┘
```

### Configuration & State Strategy

- **Netlify Routing Order (`netlify.toml`)**:
  1. `/api/*` → `https://<render-app-name>.onrender.com/api/:splat` (`status = 200`, `force = true`)
  2. `/auth/callback*` → `https://<render-app-name>.onrender.com/auth/callback:splat` (`status = 200`, `force = true`)
  3. `/*` → `/index.html` (`status = 200`, SPA client-side router fallback)
- **Render Blueprint (`render.yaml`)**:
  - Configures a `free` plan Node web service, health check path `/api/health`, auto-generated 32-byte `SESSION_SECRET`, and environment variable placeholders for `GEMINI_API_KEY`, `GITHUB_TOKEN`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `APP_URL`, and `ALLOWED_ORIGINS`.

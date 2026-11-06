# DevSync: The Ultimate University Open-Source Onboarding Platform

**Match your university coursework & GitHub coding history to beginner-friendly open-source issues, mentorship organizations (GSoC, LFX, Outreachy), and AI-guided setup checklists.**

---

## Overview

Open-source repositories can feel overwhelming for Computer Science and IT university students making their first contribution. **DevSync** eliminates cognitive overload by combining Human-Computer Interaction (HCI) heuristics (Hick's Law, Miller's Law, Fitts's Law, and Nielsen's Visibility of System Status) with a **Single-Roundtrip GitHub GraphQL & REST Engine**, **Content-Addressed SHA-256 LLM Caching**, and **O(1) Bitmask Mentorship Filtering**.

Every issue, repository, and match score on DevSync is derived from **100% live GitHub data**—zero hallucinated or static mock issues.

---

## Production Architecture & Epic Breakdown

### 1. Authentication & Session Security (NextAuth / OAuth JWT Refresh Rotation)
- **GitHub OAuth 2.0 (`read:user`, `repo` scopes):** Stores encrypted session metadata (`accessToken`, `refreshToken`, `accessTokenExpires`) in `httpOnly` cookies.
- **Automated Token Rotation:** Silently exchanges expired access tokens via `grant_type=refresh_token` before Octokit requests execute, or triggers a clean session logout (`RefreshAccessTokenError`) if a token is revoked on GitHub.

### 2. Student Pro: Automated GitHub Profile, Merged PR & Top-5 Organization Analyzer
- **Live Repository Language Scanner:** Queries `GET /users/{username}/repos` via Octokit to compute exact language percentages across a student's public repositories.
- **Merged PR Experience Classifier:** Queries `GET /search/issues?q=type:pr+author:{username}+is:merged` to determine verified open-source experience level (`First-Time Contributor`, `Coursework Only`, or `1-3 Merged PRs`).
- **Top-5 Mentorship Organization Matcher (`recommendedOrganizations`):** Automatically scores the student's analyzed tech stack against the 500+ GSoC and LFX dataset and surfaces the **Top 5 matching organizations** with one-click drill-down links directly inside the Dashboard.

### 3. Single-Roundtrip GitHub GraphQL Engine & Dead-End UX Prevention
- **GraphQL Consolidation (`OrgDrilldown`):** Replaces multi-call REST waterfalls with a single `POST /graphql` query that retrieves an organization's top 24 public repositories, primary languages, topics, exact `beginnerIssueCount` (`labels: ["good first issue", "help wanted"]`), and pre-warms the issue cache in **1 API point**.
- **Anti-Pogo-Sticking UX:** Step 2 Repository cards display the verified `beginnerIssueCount` badge (`X beginner issues`), sorting repositories with active beginner tasks to the top and visually dimming/disabling repositories with `0` beginner issues.

### 4. AI-Assisted Setup Engine with SHA-256 Content-Addressed Caching & Singleflight Coalescing
- **Un-Truncated Raw Documentation:** Fetches full `README.md` and `CONTRIBUTING.md` files directly from `raw.githubusercontent.com/{owner}/{repo}/{branch}/...` to bypass GitHub REST API base64 truncation limits, rendered inside a scrollable (`max-h-[75vh] overflow-y-auto`) container with `react-markdown` and `remark-gfm`.
- **Content-Addressed SHA-256 Cache & Stampede Protection:** Hashes the repository's `README.md` + `CONTRIBUTING.md` payload (`ai:setup:{owner}:{repo}:{sha256}`) so subsequent issue clicks across the same repository resolve in `<1ms` at **$0 LLM token cost**, while an `inFlightAiRequests` singleflight map coalesces concurrent identical requests.
- **3-Tab Guided Modal:**
  - **Tab 1: AI Setup Guide (Default):** Uses Google Gemini (`@google/genai`) acting as a Senior Dev Mentor to extract structured `prerequisites`, sequential copy-pasteable `setup_commands` (with prominent Fitts's Law **Copy Command** buttons), and `contribution_rules`, paired with an interactive 5-step Git branch/commit/PR checklist.
  - **Tab 2: Original README:** Full rendered repository `README.md`.
  - **Tab 3: CONTRIBUTING Guidelines:** Full rendered `CONTRIBUTING.md`.

### 5. Mentorship & Organization Explorer (GSoC 505 Orgs, LFX, Outreachy)
- **Complete 2016–2025 Dataset with O(1) Bitmask Year Filtering:** Parses all **505 Google Summer of Code organizations** (plus LFX Mentorship and Outreachy cohorts) and encodes participation years (`2016`–`2025`) into a 10-bit integer bitmask (`yearMask`) for O(1) multi-year intersection checks (`(org.yearMask & selectedMask) === selectedMask`).
- **300ms Debounce + `AbortController`:** Cancels stale in-flight filter requests as students type or switch tech-stack filters.
- **3-Step Progressive Disclosure Drill-Down (`Org -> Project (Repo) -> Issues`)** with **Tech Stack / Language** and **Issue Label** dropdown filters above the issue list in Step 3.

---

## Tech Stack

- **Frontend / Full-Stack Framework:** React 19, TypeScript, Vite / Next.js App Router Architecture, Express API Server (`server.ts`)
- **Authentication:** GitHub OAuth 2.0 (`read:user`, `repo` scopes) with JWT `refresh_token` rotation & `httpOnly` cookie session management
- **GitHub API Client:** `octokit` (GitHub GraphQL API v4 + REST API v3 & Search API)
- **Caching & Concurrency Layer:** Two-Tier In-Memory / Upstash Redis-Compatible Cache + Content-Addressed SHA-256 LLM Cache + Singleflight Request Coalescing
- **AI Engine:** `@google/genai` (Gemini Flash structured JSON schema output)
- **Styling & UI:** Tailwind CSS v4, Lucide Icons, `react-markdown`, `remark-gfm`

---

## Local Setup Instructions

### 1. Prerequisites
- **Node.js** 18.18+ or 20+ LTS
- **npm** 9+ or **pnpm**
- A **GitHub OAuth App** (for authenticated 5,000 pts/hr GraphQL & REST rate limits)
- A **Google Gemini API Key** (for the AI Setup Guide tab)

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/your-username/devsync.git
cd devsync
npm install
```

### 3. Configure Environment Variables (`.env.local` / `.env`)
Create a `.env` (or `.env.local`) file in the project root with the following variables:

```env
# Google Gemini API Key for the AI-Assisted Setup Engine (/api/ai/analyze-setup)
GEMINI_API_KEY="your_gemini_api_key_here"

# GitHub OAuth App Credentials (https://github.com/settings/developers)
# Set Authorization callback URL to: http://localhost:3000/auth/callback
CLIENT_ID="your_github_oauth_client_id"
CLIENT_SECRET="your_github_oauth_client_secret"

# Optional Personal Access Token fallback for server-side Octokit GraphQL/REST requests
GITHUB_TOKEN="ghp_your_optional_personal_access_token"

# Application Base URL
APP_URL="http://localhost:3000"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Unit Tests & Production Build
```bash
# Run pure unit tests (matching engine, 505 GSoC org parser, O(1) bitmask year filter, URL/handle validators)
npx tsx --test src/utils/matchingEngine.test.ts

# Compile production bundle
npm run build
```

import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Octokit } from 'octokit';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GitHubIssue } from './src/types';
import { MOCK_GITHUB_ISSUES } from './src/data/mockIssues';
import {
  encryptSessionPayload,
  decryptSessionPayload,
  generateCsrfToken,
  verifyCsrfToken
} from './src/utils/sessionCrypto';
import {
  issuesCache,
  repoIssuesCache,
  aiSetupShaCache,
  inFlightAIRequests,
  inFlightTokenRefresh,
  aiEndpointLimiter,
  profileAnalyzeLimiter,
  githubProxyLimiter,
  computeSetupContentHash
} from './server/cache';
import {
  inferTechStackFromText,
  fetchLiveRepoContext,
  fetchOrgRepositories,
  analyzeGitHubUserProfile,
  GitHubServiceError
} from './server/githubService';
import {
  generateAISetupAnalysis,
  buildHeuristicSetupAnalysis
} from './server/aiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_COOKIE_NAME = 'devsync_oauth_session';
const OAUTH_STATE_COOKIE_NAME = 'devsync_oauth_state';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`devsync-runtime-secret-${__dirname}`).digest('hex');

interface OAuthSessionCookie {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  updatedAt: number;
}

const VALID_GITHUB_HANDLE_REGEX = /^[a-zA-Z0-9._-]+$/;
const VALID_REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

function isValidGitHubHandle(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 64 && VALID_GITHUB_HANDLE_REGEX.test(value);
}

function isValidRepoName(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 100 && VALID_REPO_NAME_REGEX.test(value);
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function readOAuthSession(req: express.Request): OAuthSessionCookie | null {
  try {
    const raw = req.signedCookies?.[SESSION_COOKIE_NAME] || req.cookies?.[SESSION_COOKIE_NAME];
    if (!raw || typeof raw !== 'string') return null;

    const decrypted = decryptSessionPayload<OAuthSessionCookie>(raw, SESSION_SECRET);
    if (decrypted && typeof decrypted.accessToken === 'string') {
      return decrypted;
    }
    return null;
  } catch {
    return null;
  }
}

function writeOAuthSession(
  res: express.Response,
  session: OAuthSessionCookie,
  useCrossOriginPopup: boolean = false
): void {
  const encrypted = encryptSessionPayload(session, SESSION_SECRET);
  res.cookie(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: true,
    sameSite: useCrossOriginPopup ? 'none' : 'lax',
    signed: true,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

function clearOAuthSession(res: express.Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });
}

function getSessionSubject(req: express.Request): string {
  const session = readOAuthSession(req);
  if (session?.accessToken) {
    return crypto.createHash('sha256').update(session.accessToken).digest('hex').slice(0, 24);
  }
  return 'anonymous-session';
}

function requireCsrfProtection(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const token = req.headers['x-csrf-token'];
  const subject = getSessionSubject(req);
  if (typeof token !== 'string' || !verifyCsrfToken(token, subject, SESSION_SECRET)) {
    res.status(403).json({
      error: 'Invalid or missing CSRF security token. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED'
    });
    return;
  }
  next();
}

async function refreshGitHubAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
} | null> {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const dedupeKey = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const existingRefresh = inFlightTokenRefresh.get(dedupeKey);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshPromise = (async () => {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
      };

      if (!data.access_token || data.error) {
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined
      };
    } catch (err) {
      console.error('GitHub OAuth token rotation failed:', err);
      return null;
    } finally {
      inFlightTokenRefresh.delete(dedupeKey);
    }
  })();

  inFlightTokenRefresh.set(dedupeKey, refreshPromise);
  return refreshPromise;
}

async function resolveRequestGitHubToken(
  req: express.Request,
  res: express.Response
): Promise<string | undefined> {
  const session = readOAuthSession(req);
  if (session?.accessToken) {
    const isExpired = session.expiresAt ? Date.now() >= session.expiresAt - 60_000 : false;
    if (isExpired && session.refreshToken) {
      const refreshed = await refreshGitHubAccessToken(session.refreshToken);
      if (refreshed) {
        writeOAuthSession(res, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt,
          updatedAt: Date.now()
        });
        return refreshed.accessToken;
      }
      clearOAuthSession(res);
    } else {
      return session.accessToken;
    }
  }

  const envToken = process.env.GITHUB_TOKEN;
  if (envToken && envToken !== 'your_github_personal_access_token_here') {
    return envToken;
  }
  return undefined;
}

function getOctokitForToken(token?: string): { octokit: Octokit; hasToken: boolean } {
  const baseOptions = {
    throttle: { enabled: false },
    retry: { enabled: false },
    request: { timeout: 6000 }
  };
  if (token) {
    return { octokit: new Octokit({ ...baseOptions, auth: token }), hasToken: true };
  }
  return { octokit: new Octokit(baseOptions), hasToken: false };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Required behind Render load balancer and Netlify Edge reverse proxy
  app.set('trust proxy', 1);

  const appUrlOrigin = (() => {
    try {
      return process.env.APP_URL ? new URL(process.env.APP_URL).origin : '';
    } catch {
      return '';
    }
  })();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (origin.includes('localhost:3000') ||
        origin.includes('127.0.0.1:3000') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.onrender.com') ||
        (appUrlOrigin && origin === appUrlOrigin) ||
        allowedOrigins.includes(origin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser(SESSION_SECRET));

  // Security Headers (compatible with Google AI Studio Build preview iframe)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com https: data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-ancestors *;"
    );
    next();
  });

  // ============================================================================
  // SYSTEM HEALTH & DIAGNOSTICS ENDPOINT
  // ============================================================================
  app.get('/api/health', (req, res) => {
    const hasGitHubToken = Boolean(
      process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here'
    );
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    );
    const hasOAuthConfig = Boolean(process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID);

    res.json({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      capabilities: {
        githubServerTokenConfigured: hasGitHubToken,
        geminiAiConfigured: hasGeminiKey,
        githubOAuthConfigured: hasOAuthConfig,
        freePlatformAccess: true
      },
      cacheStats: {
        issuesCacheSize: issuesCache.size,
        repoIssuesCacheSize: repoIssuesCache.size,
        aiSetupCacheSize: aiSetupShaCache.size
      }
    });
  });

  // ============================================================================
  // CSRF & AUTHENTICATION ROUTES (With OAuth State Validation)
  // ============================================================================
  app.get(['/api/auth/csrf', '/api/csrf-token'], (req, res) => {
    const subject = getSessionSubject(req);
    const csrfToken = generateCsrfToken(subject, SESSION_SECRET);
    res.json({ csrfToken });
  });

  app.get('/api/auth/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/callback`;

    if (!clientId) {
      return res.status(400).json({
        error: 'GitHub OAuth is not configured on this server (missing GITHUB_CLIENT_ID). You can still analyze any public GitHub handle directly from the dashboard.',
        isMock: true
      });
    }

    // Generate cryptographically random state parameter to prevent OAuth Login CSRF
    const oauthState = crypto.randomBytes(24).toString('hex');
    res.cookie(OAUTH_STATE_COOKIE_NAME, oauthState, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      path: '/',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state: oauthState
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, state } = req.query;
    const expectedState = req.signedCookies?.[OAUTH_STATE_COOKIE_NAME];

    // Clear one-time state cookie immediately
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });

    if (!state || typeof state !== 'string' || !expectedState || state !== expectedState) {
      return res.status(403).send('OAuth security state mismatch (CSRF protection). Please close this window and try signing in again.');
    }

    const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('Authentication failed or missing OAuth server credentials.');
    }

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code
        })
      });

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };

      if (tokenData.access_token) {
        writeOAuthSession(
          res,
          {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
            updatedAt: Date.now()
          },
          true
        );

        const targetOrigin = process.env.APP_URL
          ? new URL(process.env.APP_URL).origin
          : '*';

        res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>GitHub Connected</title></head>
            <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <script>
                (function() {
                  var targetOrigin = ${JSON.stringify(targetOrigin)};
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, targetOrigin);
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                })();
              </script>
              <p>GitHub authentication verified. This window will close automatically.</p>
            </body>
          </html>
        `);
      } else {
        res.status(400).send('Failed to obtain access token from GitHub.');
      }
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.status(500).send('Internal Server Error during authentication.');
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const session = readOAuthSession(req);
    if (!session?.accessToken) {
      return res.status(200).json({ authenticated: false });
    }

    const token = await resolveRequestGitHubToken(req, res);
    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    try {
      const { octokit } = getOctokitForToken(token);
      const userRes = await octokit.rest.users.getAuthenticated();
      return res.json({
        authenticated: true,
        user: {
          login: userRes.data.login,
          name: userRes.data.name || userRes.data.login,
          avatarUrl: userRes.data.avatar_url,
          htmlUrl: userRes.data.html_url,
          publicRepos: userRes.data.public_repos,
          followers: userRes.data.followers
        }
      });
    } catch {
      clearOAuthSession(res);
      return res.status(200).json({ authenticated: false });
    }
  });

  app.post('/api/auth/logout', requireCsrfProtection, (req, res) => {
    clearOAuthSession(res);
    res.json({ success: true });
  });

  // ============================================================================
  // LIVE GITHUB ISSUES DISCOVERY API
  // ============================================================================
  app.get('/api/github/issues', async (req, res) => {
    const clientIp = getClientIp(req);
    const rateStatus = githubProxyLimiter.check(`issues:${clientIp}`);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${rateStatus.retryAfterSeconds}s.`,
        issues: MOCK_GITHUB_ISSUES,
        isFallback: true
      });
    }

    try {
      const languageParam = (req.query.language as string) || '';
      const cacheKey = `feed_${languageParam.toLowerCase() || 'all'}`;

      const cached = issuesCache.get(cacheKey);
      if (cached) {
        return res.json({
          issues: cached.issues,
          isFallback: cached.isFallback,
          cached: true
        });
      }

      const token = await resolveRequestGitHubToken(req, res);
      const { octokit, hasToken } = getOctokitForToken(token);

      let q = 'is:issue is:open label:"good first issue" no:assignee';
      if (languageParam && languageParam !== 'All') {
        const ghLang = languageParam === 'HTML/CSS' ? 'css' : languageParam.toLowerCase();
        q += ` language:${ghLang}`;
      }

      const searchResult = await octokit.rest.search.issuesAndPullRequests({
        q,
        sort: 'updated',
        order: 'desc',
        per_page: 24
      });

      const items = searchResult.data.items;
      if (!items || items.length === 0) {
        return res.json({
          issues: MOCK_GITHUB_ISSUES,
          isFallback: true,
          reason: 'No live issues matched query; displaying curated fallback dataset.'
        });
      }

      const transformedIssues: GitHubIssue[] = items.map((item) => {
        const repoUrlParts = item.repository_url.split('/');
        const owner = repoUrlParts[repoUrlParts.length - 2] || 'opensource';
        const repo = repoUrlParts[repoUrlParts.length - 1] || 'project';
        const fullName = `${owner}/${repo}`;

        const rawLabels = item.labels
          .map((l) => (typeof l === 'string' ? l : l.name || ''))
          .filter(Boolean);

        const bodyText = item.body || 'No detailed description provided by the issue author.';
        const cleanSummary = bodyText
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/[#*`~>]/g, '')
          .replace(/\r?\n|\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240);

        const inferred = inferTechStackFromText(item.title, bodyText, fullName);

        return {
          id: `gh-${item.id}`,
          number: item.number,
          title: item.title,
          repoName: fullName,
          repoOwner: owner,
          repoUrl: `https://github.com/${fullName}`,
          issueUrl: item.html_url,
          language:
            languageParam && languageParam !== 'All' ? languageParam : inferred.language,
          requiredSkills: inferred.skills,
          labels: rawLabels.length > 0 ? rawLabels.slice(0, 4) : ['good first issue'],
          difficulty: 'Beginner',
          estimatedEffort: '2–4 hours',
          summary: cleanSummary.length >= 240 ? `${cleanSummary}...` : cleanSummary,
          mentorAvailable: item.comments > 0,
          commentsCount: item.comments,
          assigneeCount: item.assignees ? item.assignees.length : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organizationType: inferred.orgType,
          setupSteps: [
            `git clone https://github.com/${fullName}.git`,
            `cd ${repo}`,
            `git checkout -b fix/issue-${item.number}`
          ]
        };
      });

      issuesCache.set(cacheKey, { issues: transformedIssues, isFallback: false });

      return res.json({
        issues: transformedIssues,
        isFallback: false,
        authenticated: hasToken
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'GitHub API error';
      console.warn('GitHub Issues API Warning (using fallback dataset):', errMsg);
      return res.json({
        issues: MOCK_GITHUB_ISSUES,
        isFallback: true,
        reason: errMsg
      });
    }
  });

  // ============================================================================
  // LIVE REPOSITORY CONTEXT API
  // ============================================================================
  app.get('/api/github/repo-context', async (req, res) => {
    try {
      const owner = req.query.owner as string;
      const repo = req.query.repo as string;

      if (!isValidGitHubHandle(owner) || !isValidRepoName(repo)) {
        return res.status(400).json({ error: 'Valid repository owner and repo name are required.' });
      }

      const token = await resolveRequestGitHubToken(req, res);
      const { octokit } = getOctokitForToken(token);
      const context = await fetchLiveRepoContext(octokit, owner, repo);

      return res.json({ context, cached: false });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unable to fetch repository context';
      return res.status(200).json({
        context: null,
        isFallback: true,
        reason: errMsg
      });
    }
  });

  // ============================================================================
  // AI ONBOARDING & REPOSITORY SETUP GUIDE API
  // ============================================================================
  const handleAIAnalyzeSetup = async (req: express.Request, res: express.Response) => {
    const clientIp = getClientIp(req);
    const limitResult = aiEndpointLimiter.check(`ai:${clientIp}`);
    if (!limitResult.allowed) {
      res.setHeader('Retry-After', String(limitResult.retryAfterSeconds));
      return res.status(429).json({
        error: `Fair-use AI rate limit reached. Please wait ${limitResult.retryAfterSeconds} seconds before generating another guide.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    const owner = (req.body?.owner || req.query.owner) as string;
    const repo = (req.body?.repo || req.query.repo) as string;
    const issueTitle = (req.body?.issueTitle || req.query.issueTitle || '') as string;
    const issueSummary = (req.body?.issueSummary || req.query.issueSummary || '') as string;
    const issueNumberRaw = req.body?.issueNumber || req.query.issueNumber;
    const issueNumber = issueNumberRaw ? Number(issueNumberRaw) : undefined;

    if (!isValidGitHubHandle(owner) || !isValidRepoName(repo)) {
      return res.status(400).json({ error: 'Valid owner and repo parameters are required.' });
    }

    try {
      const token = await resolveRequestGitHubToken(req, res);
      const { octokit } = getOctokitForToken(token);
      const repoContext = await fetchLiveRepoContext(octokit, owner, repo);

      const contentSha256 = computeSetupContentHash(
        owner,
        repo,
        repoContext.readmeSnippet,
        repoContext.contributingSnippet,
        repoContext.manifestSummary || null,
        issueTitle
      );

      const cachedAnalysis = aiSetupShaCache.get(contentSha256);
      if (cachedAnalysis) {
        return res.json({
          analysis: cachedAnalysis,
          cached: true,
          contentSha256,
          isFallback: false
        });
      }

      let flightPromise = inFlightAIRequests.get(contentSha256);
      if (!flightPromise) {
        flightPromise = (async () => {
          try {
            const { analysis } = await generateAISetupAnalysis(
              owner,
              repo,
              repoContext,
              issueTitle,
              issueSummary,
              issueNumber
            );
            aiSetupShaCache.set(contentSha256, analysis);
            return analysis;
          } finally {
            inFlightAIRequests.delete(contentSha256);
          }
        })();
        inFlightAIRequests.set(contentSha256, flightPromise);
      }

      const analysis = await flightPromise;
      const isFallback = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here';

      return res.json({
        analysis,
        cached: false,
        contentSha256,
        isFallback
      });
    } catch (error: unknown) {
      const fallbackContext = {
        fullName: `${owner}/${repo}`,
        description: 'Open-source repository.',
        stars: 0,
        forks: 0,
        openIssues: 0,
        defaultBranch: 'main',
        license: 'Open Source',
        language: 'TypeScript',
        topics: [],
        htmlUrl: `https://github.com/${owner}/${repo}`,
        updatedAt: new Date().toISOString(),
        readmeSnippet: null,
        contributingSnippet: null,
        rootFiles: [],
        manifestSummary: null
      };
      const fallback = buildHeuristicSetupAnalysis(owner, repo, fallbackContext, issueTitle, issueSummary);
      return res.status(200).json({
        analysis: fallback,
        cached: false,
        isFallback: true,
        reason: error instanceof Error ? error.message : 'Fallback onboarding guide generated.'
      });
    }
  };

  app.get('/api/ai/analyze-setup', handleAIAnalyzeSetup);
  app.post('/api/ai/analyze-setup', requireCsrfProtection, handleAIAnalyzeSetup);

  // ============================================================================
  // MENTORSHIP EXPLORER: ORG REPOSITORIES API
  // ============================================================================
  app.get('/api/github/org-repos', async (req, res) => {
    try {
      const orgHandle = ((req.query.org as string) || '').trim();
      const orgName = ((req.query.name as string) || '').trim();

      if (!isValidGitHubHandle(orgHandle)) {
        return res.status(400).json({ error: 'Valid GitHub organization handle is required.' });
      }

      const token = await resolveRequestGitHubToken(req, res);
      const { octokit, hasToken } = getOctokitForToken(token);

      const repos = await fetchOrgRepositories(octokit, hasToken, orgHandle, orgName);
      return res.json({
        repos,
        cached: false,
        beginnerCountVerified: hasToken
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to fetch repositories';
      console.warn('Org Repos API warning:', errMsg);
      return res.status(200).json({
        repos: [],
        isFallback: true,
        reason: errMsg
      });
    }
  });

  // ============================================================================
  // MENTORSHIP EXPLORER: REPOSITORY BEGINNER ISSUES API
  // ============================================================================
  app.get('/api/github/repo-issues', async (req, res) => {
    try {
      const owner = ((req.query.owner as string) || '').trim();
      const repo = ((req.query.repo as string) || '').trim();

      if (!isValidGitHubHandle(owner) || !isValidRepoName(repo)) {
        return res.status(400).json({ error: 'Valid owner and repo parameters are required.' });
      }

      const fullName = `${owner}/${repo}`;
      const cacheKey = fullName.toLowerCase();

      const cached = repoIssuesCache.get(cacheKey);
      if (cached) {
        return res.json({ issues: cached, cached: true });
      }

      const token = await resolveRequestGitHubToken(req, res);
      const { octokit } = getOctokitForToken(token);

      let rawItems: Array<{
        id: number;
        number: number;
        title: string;
        html_url: string;
        body?: string | null;
        comments: number;
        assignees?: Array<unknown> | null;
        created_at: string;
        updated_at: string;
        labels: Array<string | { name?: string }>;
        pull_request?: unknown;
      }> = [];

      try {
        const searchRes = await octokit.rest.search.issuesAndPullRequests({
          q: `repo:${fullName} is:issue is:open label:"good first issue","help wanted","beginner","easy","first-timers-only"`,
          sort: 'updated',
          order: 'desc',
          per_page: 20
        });
        rawItems = searchRes.data.items;
      } catch {
        // Fallback to general open issues below
      }

      if (rawItems.length === 0) {
        const openRes = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: 'open',
          sort: 'updated',
          direction: 'desc',
          per_page: 20
        });
        rawItems = openRes.data.filter((item) => !item.pull_request);
      }

      const issues: GitHubIssue[] = rawItems.slice(0, 15).map((item) => {
        const rawLabels = item.labels
          .map((l) => (typeof l === 'string' ? l : l.name || ''))
          .filter(Boolean);

        const bodyText = item.body || 'No detailed description provided by the issue author.';
        const cleanSummary = bodyText
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/[#*`~>]/g, '')
          .replace(/\r?\n|\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240);

        const inferred = inferTechStackFromText(item.title, bodyText, fullName);
        const isBeginnerLabeled = rawLabels.some((l) =>
          /good first issue|beginner|easy|starter|first-timers/i.test(l)
        );

        return {
          id: `repo-issue-${item.id}`,
          number: item.number,
          title: item.title,
          repoName: fullName,
          repoOwner: owner,
          repoUrl: `https://github.com/${fullName}`,
          issueUrl: item.html_url,
          language: inferred.language,
          requiredSkills: inferred.skills,
          labels: rawLabels.length > 0 ? rawLabels.slice(0, 4) : ['open issue'],
          difficulty: isBeginnerLabeled ? 'Beginner' : 'Intermediate',
          estimatedEffort: isBeginnerLabeled ? '2–4 hours' : '4–8 hours',
          summary: cleanSummary.length >= 240 ? `${cleanSummary}...` : cleanSummary,
          mentorAvailable: item.comments > 0,
          commentsCount: item.comments,
          assigneeCount: Array.isArray(item.assignees) ? item.assignees.length : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organizationType: 'GSoC Mentorship Org',
          setupSteps: [
            `git clone https://github.com/${fullName}.git`,
            `cd ${repo}`,
            `git checkout -b fix/issue-${item.number}`
          ]
        };
      });

      repoIssuesCache.set(cacheKey, issues);
      return res.json({ issues, cached: false });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to fetch repository issues';
      console.warn('Repo Issues API warning:', errMsg);
      return res.status(200).json({
        issues: [],
        isFallback: true,
        reason: errMsg
      });
    }
  });

  // ============================================================================
  // AUTOMATED GITHUB PROFILE ANALYZER API (100% Free, Honest Telemetry)
  // ============================================================================
  app.get('/api/github/analyze-profile', async (req, res) => {
    const clientIp = getClientIp(req);
    const limitResult = profileAnalyzeLimiter.check(`profile:${clientIp}`);
    if (!limitResult.allowed) {
      res.setHeader('Retry-After', String(limitResult.retryAfterSeconds));
      return res.status(429).json({
        error: `Profile analyzer rate limit reached. Please wait ${limitResult.retryAfterSeconds} seconds before scanning another handle.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    const rawUsername = ((req.query.username as string) || '').trim();
    const cleanUsername = rawUsername
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .trim();

    if (!isValidGitHubHandle(cleanUsername)) {
      return res.status(400).json({
        error: 'Please enter a valid GitHub username (letters, numbers, hyphens).',
        code: 'INVALID_GITHUB_HANDLE'
      });
    }

    try {
      const token = await resolveRequestGitHubToken(req, res);
      const { octokit, hasToken } = getOctokitForToken(token);
      const payload = await analyzeGitHubUserProfile(octokit, hasToken, cleanUsername);

      return res.json({
        ...payload,
        cached: false
      });
    } catch (error: unknown) {
      if (error instanceof GitHubServiceError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }
      const errMsg = error instanceof Error ? error.message : 'Unexpected error analyzing GitHub profile.';
      return res.status(502).json({
        error: errMsg,
        code: 'GITHUB_ANALYSIS_FAILED'
      });
    }
  });

  // ============================================================================
  // VITE DEV MIDDLEWARE / PRODUCTION STATIC ASSETS & SPA FALLBACK
  // ============================================================================
  // Ensure unmatched /api/* routes return a proper JSON 404 instead of index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Development SPA catch-all fallback: serve transformed index.html for all client-side routes
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.join(__dirname, 'index.html');
        const template = await fs.promises.readFile(indexPath, 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));

    // Production SPA catch-all fallback: serve built dist/index.html for all client-side routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DevSync Server running on http://localhost:${PORT}`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing HTTP server cleanly...`);
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();

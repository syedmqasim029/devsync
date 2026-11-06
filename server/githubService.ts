import { Octokit } from 'octokit';
import type {
  GitHubIssue,
  LiveRepoContext,
  OrgRepository,
  ProfileAnalysisResponse,
  LanguageTelemetry,
  ContributionTelemetry
} from '../src/types';
import { determineExperienceClassification } from '../src/utils/matchingEngine';
import {
  repoContextCache,
  orgReposCache,
  profileAnalysisCache
} from './cache';

const REPO_TECH_MAPPING: Record<string, { language: string; skills: string[]; orgType: string }> = {
  'facebook/react': { language: 'JavaScript', skills: ['React', 'JavaScript', 'HTML/CSS'], orgType: 'Frontend Library' },
  'vercel/next.js': { language: 'TypeScript', skills: ['Next.js', 'React', 'TypeScript', 'Node.js'], orgType: 'Full-Stack Framework' },
  'tailwindlabs/tailwindcss': { language: 'TypeScript', skills: ['Tailwind CSS', 'HTML/CSS', 'TypeScript'], orgType: 'CSS Framework' },
  'fastapi/fastapi': { language: 'Python', skills: ['Python', 'FastAPI', 'SQL'], orgType: 'Backend Framework' },
  'pallets/flask': { language: 'Python', skills: ['Python', 'HTML/CSS'], orgType: 'Micro Web Framework' },
  'django/django': { language: 'Python', skills: ['Python', 'Django', 'SQL', 'PostgreSQL'], orgType: 'Web Framework' },
  'microsoft/vscode': { language: 'TypeScript', skills: ['TypeScript', 'Node.js', 'HTML/CSS'], orgType: 'Developer Tool' },
  'nodejs/node': { language: 'JavaScript', skills: ['Node.js', 'JavaScript', 'C++'], orgType: 'Runtime Environment' },
  'supabase/supabase': { language: 'TypeScript', skills: ['TypeScript', 'React', 'PostgreSQL', 'SQL'], orgType: 'Open Source Firebase' }
};

export function inferTechStackFromText(title: string, body: string, repoFullName: string): { language: string; skills: string[]; orgType: string } {
  const known = REPO_TECH_MAPPING[repoFullName.toLowerCase()];
  if (known) return known;

  const combined = `${title} ${body} ${repoFullName}`.toLowerCase();
  const skills: string[] = [];
  let language = 'TypeScript';

  if (combined.includes('python') || combined.includes('django') || combined.includes('fastapi') || combined.includes('flask') || combined.includes('pytest')) {
    language = 'Python';
    skills.push('Python');
    if (combined.includes('fastapi')) skills.push('FastAPI');
    if (combined.includes('django')) skills.push('Django');
  } else if (combined.includes('rust') || combined.includes('cargo')) {
    language = 'Rust';
    skills.push('Rust');
  } else if (combined.includes('golang') || combined.includes('go.mod')) {
    language = 'Go';
    skills.push('Go');
  } else if (combined.includes('java') && !combined.includes('javascript')) {
    language = 'Java';
    skills.push('Java');
  } else if (combined.includes('react') || combined.includes('next.js') || combined.includes('tsx')) {
    language = 'TypeScript';
    skills.push('TypeScript', 'React');
    if (combined.includes('next')) skills.push('Next.js');
  } else if (combined.includes('css') || combined.includes('tailwind') || combined.includes('ui')) {
    language = 'HTML/CSS';
    skills.push('HTML/CSS', 'Tailwind CSS');
  } else if (combined.includes('node') || combined.includes('express') || combined.includes('javascript')) {
    language = 'JavaScript';
    skills.push('JavaScript', 'Node.js');
  } else {
    skills.push('TypeScript', 'JavaScript');
  }

  return {
    language,
    skills: Array.from(new Set(skills)),
    orgType: 'Open-Source Project'
  };
}

export class GitHubServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'GitHubServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Fetches rich repository context including metadata, README.md, CONTRIBUTING.md,
 * top-level directory files (rootFiles), and project manifest summary (package.json, pyproject.toml, etc.).
 */
export async function fetchLiveRepoContext(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<LiveRepoContext> {
  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cached = repoContextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const repoRes = await octokit.rest.repos.get({ owner, repo });
  const r = repoRes.data;

  // Fetch README, CONTRIBUTING, and root directory listing in parallel
  const [readmeResult, contributingResult, rootContentsResult] = await Promise.allSettled([
    octokit.rest.repos.getReadme({ owner, repo }),
    octokit.rest.repos.getContent({ owner, repo, path: 'CONTRIBUTING.md' }),
    octokit.rest.repos.getContent({ owner, repo, path: '' })
  ]);

  let readmeSnippet: string | null = null;
  if (readmeResult.status === 'fulfilled' && 'content' in readmeResult.value.data) {
    const decoded = Buffer.from(readmeResult.value.data.content, 'base64').toString('utf-8');
    readmeSnippet = decoded
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()
      .slice(0, 1800);
  }

  let contributingSnippet: string | null = null;
  if (
    contributingResult.status === 'fulfilled' &&
    !Array.isArray(contributingResult.value.data) &&
    'content' in contributingResult.value.data
  ) {
    const decoded = Buffer.from(contributingResult.value.data.content, 'base64').toString('utf-8');
    contributingSnippet = decoded
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()
      .slice(0, 1500);
  }

  // Extract root directory file & folder names
  const rootFiles: string[] = [];
  if (rootContentsResult.status === 'fulfilled' && Array.isArray(rootContentsResult.value.data)) {
    for (const item of rootContentsResult.value.data.slice(0, 35)) {
      rootFiles.push(item.type === 'dir' ? `${item.name}/` : item.name);
    }
  }

  // If a recognized project manifest exists in rootFiles, fetch a compact summary of scripts/dependencies
  let manifestSummary: string | null = null;
  const manifestCandidates = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'Makefile'];
  const foundManifest = manifestCandidates.find((m) => rootFiles.includes(m));

  if (foundManifest) {
    try {
      const manifestRes = await octokit.rest.repos.getContent({ owner, repo, path: foundManifest });
      if (!Array.isArray(manifestRes.data) && 'content' in manifestRes.data) {
        const rawManifest = Buffer.from(manifestRes.data.content, 'base64').toString('utf-8');
        if (foundManifest === 'package.json') {
          try {
            const parsed = JSON.parse(rawManifest) as {
              name?: string;
              scripts?: Record<string, string>;
              dependencies?: Record<string, string>;
              devDependencies?: Record<string, string>;
              packageManager?: string;
            };
            const scriptsList = Object.entries(parsed.scripts || {})
              .slice(0, 10)
              .map(([k, v]) => `${k}: "${v}"`)
              .join(', ');
            const depsList = [
              ...Object.keys(parsed.dependencies || {}).slice(0, 12),
              ...Object.keys(parsed.devDependencies || {}).slice(0, 8)
            ].join(', ');
            manifestSummary = `package.json (${parsed.packageManager || 'npm/yarn/pnpm'}) — Scripts: [${scriptsList || 'none'}] — Key packages: [${depsList || 'none'}]`;
          } catch {
            manifestSummary = `package.json: ${rawManifest.slice(0, 500)}`;
          }
        } else {
          manifestSummary = `${foundManifest}:\n${rawManifest.slice(0, 600)}`;
        }
      }
    } catch {
      // Optional manifest enrichment failed; continue cleanly
    }
  }

  const context: LiveRepoContext = {
    fullName: r.full_name,
    description: r.description || 'No description provided.',
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    defaultBranch: r.default_branch,
    license: r.license?.spdx_id || 'Open Source',
    language: r.language || 'Unknown',
    topics: r.topics || [],
    htmlUrl: r.html_url,
    updatedAt: r.updated_at,
    readmeSnippet,
    contributingSnippet,
    rootFiles,
    manifestSummary
  };

  repoContextCache.set(cacheKey, context);
  return context;
}

/**
 * Fetches an organization's top repositories.
 * - With GraphQL token: fetches exact `beginnerIssueCount` (`beginnerCountVerified: true`).
 * - Without GraphQL token (REST mode): fetches real repository metrics (`stars`, `forks`, `openIssuesCount`)
 *   and sets `beginnerCountVerified: false` and `beginnerIssueCount: 0` instead of fabricating 15% of open issues.
 */
export async function fetchOrgRepositories(
  octokit: Octokit,
  hasToken: boolean,
  orgHandle: string,
  orgName?: string
): Promise<OrgRepository[]> {
  const cacheKey = `${orgHandle.toLowerCase()}::${hasToken ? 'gql' : 'rest'}`;
  const cached = orgReposCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  interface GraphQLRepoNode {
    id: string;
    name: string;
    nameWithOwner: string;
    description: string | null;
    url: string;
    stargazerCount: number;
    forkCount: number;
    updatedAt: string;
    primaryLanguage: { name: string } | null;
    repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
    openIssues: { totalCount: number };
    beginnerIssues: { totalCount: number };
  }

  const graphqlQuery = `
    query GetOrgReposWithIssueCounts($org: String!) {
      repositoryOwner(login: $org) {
        repositories(
          first: 18,
          privacy: PUBLIC,
          isFork: false,
          isArchived: false,
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          nodes {
            id
            name
            nameWithOwner
            description
            url
            stargazerCount
            forkCount
            updatedAt
            primaryLanguage { name }
            repositoryTopics(first: 6) {
              nodes { topic { name } }
            }
            openIssues: issues(states: OPEN) {
              totalCount
            }
            beginnerIssues: issues(
              states: OPEN,
              labels: ["good first issue", "help wanted", "beginner", "easy", "first-timers-only", "starter"]
            ) {
              totalCount
            }
          }
        }
      }
    }
  `;

  let repos: OrgRepository[] = [];

  if (hasToken) {
    try {
      const gqlRes = await octokit.graphql<{
        repositoryOwner: { repositories: { nodes: GraphQLRepoNode[] } } | null;
      }>(graphqlQuery, { org: orgHandle });

      const nodes = gqlRes?.repositoryOwner?.repositories?.nodes || [];
      if (nodes.length > 0) {
        repos = nodes
          .map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.nameWithOwner,
            description: r.description || 'Active open-source project welcoming contributors.',
            language: r.primaryLanguage?.name || 'Multi-Language',
            stars: r.stargazerCount || 0,
            forks: r.forkCount || 0,
            openIssuesCount: r.openIssues?.totalCount || 0,
            beginnerIssueCount: r.beginnerIssues?.totalCount || 0,
            beginnerCountVerified: true,
            topics: (r.repositoryTopics?.nodes || []).map((n) => n.topic.name),
            updatedAt: r.updatedAt || new Date().toISOString(),
            htmlUrl: r.url
          }))
          .sort((a, b) => {
            if (b.beginnerIssueCount !== a.beginnerIssueCount) {
              return b.beginnerIssueCount - a.beginnerIssueCount;
            }
            return b.stars - a.stars;
          });
      }
    } catch (gqlErr) {
      console.warn(`GraphQL org-repos query failed for "${orgHandle}", falling back to REST search:`, gqlErr);
    }
  }

  // REST Fallback if unauthenticated or if handle is a search query
  if (repos.length === 0) {
    let items: Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      topics?: string[];
      updated_at: string;
      html_url: string;
    }> = [];

    try {
      const searchRes = await octokit.rest.search.repos({
        q: `user:${orgHandle} fork:false archived:false`,
        sort: 'stars',
        order: 'desc',
        per_page: 18
      });
      items = searchRes.data.items;
    } catch {
      const fallbackQuery = orgName || orgHandle;
      const fallbackRes = await octokit.rest.search.repos({
        q: `${fallbackQuery} in:name,description fork:false archived:false`,
        sort: 'stars',
        order: 'desc',
        per_page: 15
      });
      items = fallbackRes.data.items;
    }

    repos = items
      .filter((r) => (r.open_issues_count || 0) > 0)
      .map((r) => ({
        id: String(r.id),
        name: r.name,
        fullName: r.full_name,
        description: r.description || 'Active open-source project welcoming contributors.',
        language: r.language || 'Multi-Language',
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        openIssuesCount: r.open_issues_count || 0,
        beginnerIssueCount: 0,
        beginnerCountVerified: false,
        topics: r.topics || [],
        updatedAt: r.updated_at || new Date().toISOString(),
        htmlUrl: r.html_url
      }));
  }

  orgReposCache.set(cacheKey, repos);
  return repos;
}

/**
 * Analyzes a GitHub user's public engineering profile.
 * - Uses GraphQL when a GitHub token is configured (exact language bytes + exact commit/PR/review telemetry).
 * - Uses REST when unauthenticated:
 *   - Verifies the user exists via `octokit.rest.users.getByUsername`. If 404, throws a 404 GitHubServiceError (NEVER returns fake TypeScript 100% data).
 *   - Computes real language bytes across top non-fork repositories via `octokit.rest.repos.listLanguages`.
 *   - Queries real public merged PR count via `octokit.rest.search.issuesAndPullRequests`.
 *   - Sets `totalCommitContributions: null` and `exactGraphQL: false` instead of fabricating commit/review multipliers.
 */
export async function analyzeGitHubUserProfile(
  octokit: Octokit,
  hasToken: boolean,
  username: string
): Promise<ProfileAnalysisResponse> {
  const normalizedUser = username.trim().toLowerCase();
  const cacheKey = `profile::${normalizedUser}::${hasToken ? 'gql' : 'rest'}`;
  const cached = profileAnalysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  interface GraphQLProfileResponse {
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      bio: string | null;
      followers: { totalCount: number };
      repositories: {
        totalCount: number;
        nodes: Array<{
          name: string;
          repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
          languages: {
            edges: Array<{
              size: number;
              node: { name: string; color: string | null };
            }>;
          };
        }>;
      };
      mergedPRs: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
      };
    } | null;
  }

  const profileGraphQLQuery = `
    query AnalyzeDeveloperProfile($login: String!) {
      user(login: $login) {
        login
        name
        avatarUrl
        bio
        followers { totalCount }
        mergedPRs: pullRequests(states: MERGED) {
          totalCount
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
        }
        repositories(
          first: 30,
          ownerAffiliations: OWNER,
          isFork: false,
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          totalCount
          nodes {
            name
            repositoryTopics(first: 8) {
              nodes { topic { name } }
            }
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  const TOPIC_TO_FRAMEWORK: Record<string, string> = {
    react: 'React',
    reactjs: 'React',
    nextjs: 'Next.js',
    'next-js': 'Next.js',
    nodejs: 'Node.js',
    node: 'Node.js',
    express: 'Express',
    expressjs: 'Express',
    tailwindcss: 'Tailwind CSS',
    tailwind: 'Tailwind CSS',
    django: 'Django',
    fastapi: 'FastAPI',
    'spring-boot': 'Spring Boot',
    vue: 'Vue.js',
    vuejs: 'Vue.js',
    angular: 'Angular',
    docker: 'Docker',
    graphql: 'GraphQL',
    postgresql: 'PostgreSQL',
    postgres: 'PostgreSQL',
    mongodb: 'MongoDB'
  };

  const DEFAULT_LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    Go: '#00ADD8',
    Rust: '#dea584',
    'HTML/CSS': '#e34c26',
    SQL: '#e38c00',
    PHP: '#4F5D95',
    'C#': '#178600',
    Ruby: '#701516'
  };

  function normalizeLanguageName(langName: string): string {
    if (langName === 'HTML' || langName === 'CSS' || langName === 'SCSS') {
      return 'HTML/CSS';
    }
    return langName;
  }

  let login = username;
  let avatarUrl = '';
  let name = username;
  let bio = '';
  let publicRepos = 0;
  let followers = 0;
  let mergedPrCount = 0;
  const languageBytesMap: Record<string, { bytes: number; color: string }> = {};
  const detectedFrameworks = new Set<string>();
  let contributions: ContributionTelemetry = {
    totalCommitContributions: null,
    totalPullRequestContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestReviewContributions: 0,
    mergedPrCount: 0,
    exactGraphQL: false
  };

  let usedGraphQL = false;

  if (hasToken) {
    try {
      const gqlRes = await octokit.graphql<GraphQLProfileResponse>(profileGraphQLQuery, {
        login: username
      });

      if (!gqlRes?.user) {
        throw new GitHubServiceError(
          `GitHub user "@${username}" was not found. Please check the username spelling.`,
          404,
          'GITHUB_USER_NOT_FOUND'
        );
      }

      const u = gqlRes.user;
      usedGraphQL = true;
      login = u.login;
      avatarUrl = u.avatarUrl;
      name = u.name || u.login;
      bio = u.bio || '';
      publicRepos = u.repositories.totalCount;
      followers = u.followers.totalCount;
      mergedPrCount = u.mergedPRs.totalCount;

      contributions = {
        totalCommitContributions: u.contributionsCollection.totalCommitContributions,
        totalPullRequestContributions: u.contributionsCollection.totalPullRequestContributions,
        totalIssueContributions: u.contributionsCollection.totalIssueContributions,
        totalPullRequestReviewContributions: u.contributionsCollection.totalPullRequestReviewContributions,
        mergedPrCount,
        exactGraphQL: true
      };

      for (const repo of u.repositories.nodes) {
        for (const edge of repo.languages.edges) {
          const langName = normalizeLanguageName(edge.node.name);
          const color = edge.node.color || DEFAULT_LANG_COLORS[langName] || '#6366f1';
          if (!languageBytesMap[langName]) {
            languageBytesMap[langName] = { bytes: 0, color };
          }
          languageBytesMap[langName].bytes += edge.size;
        }

        for (const tNode of repo.repositoryTopics.nodes) {
          const topicLower = tNode.topic.name.toLowerCase();
          if (TOPIC_TO_FRAMEWORK[topicLower]) {
            detectedFrameworks.add(TOPIC_TO_FRAMEWORK[topicLower]);
          }
        }
      }
    } catch (gqlErr) {
      if (gqlErr instanceof GitHubServiceError) {
        throw gqlErr;
      }
      console.warn(`GraphQL profile analysis failed for "${username}", attempting REST API:`, gqlErr);
    }
  }

  if (!usedGraphQL) {
    // 1. Fetch user metadata — do NOT swallow 404 or 403/429 errors with fake data
    let userRes;
    try {
      userRes = await octokit.rest.users.getByUsername({ username });
    } catch (err: unknown) {
      const status = typeof err === 'object' && err !== null && 'status' in err ? Number((err as { status: unknown }).status) : 500;
      if (status === 404) {
        throw new GitHubServiceError(
          `GitHub user "@${username}" does not exist. Verify the handle and try again.`,
          404,
          'GITHUB_USER_NOT_FOUND'
        );
      }
      if (status === 403 || status === 429) {
        throw new GitHubServiceError(
          'GitHub public API rate limit reached. Connect GitHub OAuth or configure GITHUB_TOKEN for 5,000 req/hr capacity.',
          429,
          'GITHUB_RATE_LIMIT'
        );
      }
      throw new GitHubServiceError(
        `Unable to reach GitHub API to verify "@${username}". Please try again shortly.`,
        502,
        'GITHUB_UPSTREAM_ERROR'
      );
    }

    login = userRes.data.login;
    avatarUrl = userRes.data.avatar_url;
    name = userRes.data.name || userRes.data.login;
    bio = userRes.data.bio || '';
    publicRepos = userRes.data.public_repos;
    followers = userRes.data.followers;

    // 2. Fetch non-fork repositories and merged PR count in parallel
    const [reposResult, prsResult] = await Promise.allSettled([
      octokit.rest.repos.listForUser({
        username: login,
        sort: 'updated',
        per_page: 20,
        type: 'owner'
      }),
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${login} type:pr is:merged`,
        per_page: 1
      })
    ]);

    const nonForkRepos =
      reposResult.status === 'fulfilled'
        ? reposResult.value.data.filter((r) => !r.fork)
        : [];

    if (prsResult.status === 'fulfilled') {
      mergedPrCount = prsResult.value.data.total_count;
    }

    // 3. Query real per-language byte counts from GitHub's Languages API for up to 8 most recently updated non-fork repos
    const topReposForLang = nonForkRepos.slice(0, 8);
    const langResults = await Promise.allSettled(
      topReposForLang.map((r) =>
        octokit.rest.repos.listLanguages({
          owner: login,
          repo: r.name
        })
      )
    );

    langResults.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        const langMap = res.value.data;
        for (const [rawLang, byteCount] of Object.entries(langMap)) {
          if (typeof byteCount === 'number' && byteCount > 0) {
            const langName = normalizeLanguageName(rawLang);
            const color = DEFAULT_LANG_COLORS[langName] || '#6366f1';
            if (!languageBytesMap[langName]) {
              languageBytesMap[langName] = { bytes: 0, color };
            }
            languageBytesMap[langName].bytes += byteCount;
          }
        }
      } else {
        // Fallback if listLanguages call for a single repo fails: record primary language with 1 byte marker
        const fallbackLang = topReposForLang[idx]?.language;
        if (fallbackLang) {
          const langName = normalizeLanguageName(fallbackLang);
          const color = DEFAULT_LANG_COLORS[langName] || '#6366f1';
          if (!languageBytesMap[langName]) {
            languageBytesMap[langName] = { bytes: 0, color };
          }
          languageBytesMap[langName].bytes += 1;
        }
      }
    });

    // Extract framework topics from repo metadata
    for (const r of nonForkRepos) {
      if (Array.isArray(r.topics)) {
        for (const topic of r.topics) {
          const lower = topic.toLowerCase();
          if (TOPIC_TO_FRAMEWORK[lower]) {
            detectedFrameworks.add(TOPIC_TO_FRAMEWORK[lower]);
          }
        }
      }
    }

    // Honest REST telemetry: do NOT fabricate commits (`nonForkRepos.length * 14`) or reviews (`mergedPrCount * 0.4`)
    contributions = {
      totalCommitContributions: null,
      totalPullRequestContributions: mergedPrCount,
      totalIssueContributions: 0,
      totalPullRequestReviewContributions: 0,
      mergedPrCount,
      exactGraphQL: false
    };
  }

  const totalLanguageBytes = Object.values(languageBytesMap).reduce((sum, item) => sum + item.bytes, 0);

  const languageBreakdown: LanguageTelemetry[] = Object.entries(languageBytesMap)
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 6)
    .map(([nameKey, info]) => ({
      name: nameKey,
      bytes: info.bytes,
      percentage: totalLanguageBytes > 0 ? Math.max(1, Math.round((info.bytes / totalLanguageBytes) * 100)) : 0,
      color: info.color
    }));

  const topLanguages = languageBreakdown.slice(0, 4).map((l) => l.name);

  const { level: experienceLevel, classificationNote } = determineExperienceClassification(
    mergedPrCount,
    contributions.exactGraphQL
  );

  const payload: ProfileAnalysisResponse = {
    username: login,
    avatarUrl,
    name,
    bio,
    publicRepos,
    followers,
    mergedPrCount,
    topLanguages,
    languageBreakdown,
    detectedFrameworks: Array.from(detectedFrameworks).slice(0, 6),
    contributions,
    recommendedExperienceLevel: experienceLevel,
    classificationNote
  };

  profileAnalysisCache.set(cacheKey, payload);
  return payload;
}

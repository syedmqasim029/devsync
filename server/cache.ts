import crypto from 'crypto';
import type {
  GitHubIssue,
  LiveRepoContext,
  OrgRepository,
  AISetupAnalysis,
  ProfileAnalysisResponse
} from '../src/types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Bounded LRU Cache with strict TTL expiration and O(1) eviction.
 */
export class LRUCache<K, V> {
  private maxEntries: number;
  private ttlMs: number;
  private cache: Map<K, CacheEntry<V>>;

  constructor(maxEntries: number, ttlMs: number) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.cache = new Map<K, CacheEntry<V>>();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Sliding-Window Rate Limiter with bounded key storage.
 */
export class SlidingWindowRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private maxTrackedKeys: number;
  private hits: Map<string, number[]>;

  constructor(windowMs: number, maxRequests: number, maxTrackedKeys: number = 2000) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxTrackedKeys = maxTrackedKeys;
    this.hits = new Map<string, number[]>();
  }

  check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const existing = this.hits.get(key) || [];
    const active = existing.filter((t) => t > cutoff);

    if (active.length >= this.maxRequests) {
      const oldestInWindow = active[0] || now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + this.windowMs - now) / 1000));
      this.hits.set(key, active);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    active.push(now);
    if (!this.hits.has(key) && this.hits.size >= this.maxTrackedKeys) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey !== undefined) {
        this.hits.delete(oldestKey);
      }
    }
    this.hits.set(key, active);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - active.length),
      retryAfterSeconds: 0
    };
  }
}

export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const AI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const issuesCache = new LRUCache<string, { issues: GitHubIssue[]; isFallback: boolean }>(50, CACHE_TTL_MS);
export const repoContextCache = new LRUCache<string, LiveRepoContext>(200, CACHE_TTL_MS);
export const orgReposCache = new LRUCache<string, OrgRepository[]>(150, CACHE_TTL_MS);
export const repoIssuesCache = new LRUCache<string, GitHubIssue[]>(250, CACHE_TTL_MS);
export const aiSetupShaCache = new LRUCache<string, AISetupAnalysis>(300, AI_CACHE_TTL_MS);
export const profileAnalysisCache = new LRUCache<string, ProfileAnalysisResponse>(200, CACHE_TTL_MS);

// Singleflight request deduplication maps
export const inFlightAIRequests = new Map<string, Promise<AISetupAnalysis>>();
export const inFlightTokenRefresh = new Map<string, Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number } | null>>();

// Fair-use rate limiters (protects free student platform from automated abuse)
export const aiEndpointLimiter = new SlidingWindowRateLimiter(60 * 1000, 12); // 12 req / min / IP
export const profileAnalyzeLimiter = new SlidingWindowRateLimiter(60 * 1000, 15); // 15 req / min / IP
export const githubProxyLimiter = new SlidingWindowRateLimiter(60 * 1000, 60); // 60 req / min / IP

export function computeSetupContentHash(
  owner: string,
  repo: string,
  readmeSnippet: string | null,
  contributingSnippet: string | null,
  manifestSummary: string | null,
  issueTitle: string
): string {
  return crypto
    .createHash('sha256')
    .update(
      `${owner.toLowerCase()}/${repo.toLowerCase()}::${readmeSnippet || ''}::${contributingSnippet || ''}::${manifestSummary || ''}::${issueTitle || ''}`
    )
    .digest('hex');
}

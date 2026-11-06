import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce recommended for AES-GCM

const EPHEMERAL_DEV_SECRET = crypto.randomBytes(32).toString('hex');

export function getRuntimeSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }
  return EPHEMERAL_DEV_SECRET;
}

function deriveKey(secret?: string): Buffer {
  const rawSecret =
    secret && secret.trim().length > 0
      ? secret.trim()
      : getRuntimeSessionSecret();
  return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts and authenticates a JSON-serializable payload using AES-256-GCM.
 * Output format: base64url(iv).base64url(authTag).base64url(ciphertext)
 */
export function encryptSessionCookie(payload: object, secret?: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

/**
 * Decrypts and verifies an AES-256-GCM encrypted cookie string.
 * Returns null if tampered, malformed, or encrypted with a different key.
 */
export function decryptSessionCookie<T = Record<string, unknown>>(
  cookieValue: string | undefined | null,
  secret?: string
): T | null {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;

  try {
    const key = deriveKey(secret);
    const iv = Buffer.from(parts[0], 'base64url');
    const authTag = Buffer.from(parts[1], 'base64url');
    const ciphertext = Buffer.from(parts[2], 'base64url');

    if (iv.length !== IV_LENGTH || authTag.length !== 16) {
      return null;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    return null;
  }
}

export const encryptSessionPayload = encryptSessionCookie;
export const decryptSessionPayload = decryptSessionCookie;

/**
 * Strict whitelist validation for GitHub usernames and organization handles.
 * Allows 1-39 alphanumeric characters or single hyphens (cannot start/end with hyphen).
 */
export function sanitizeGitHubIdentifier(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/^@/, '');
  if (!cleaned || cleaned.length > 39) return null;
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Strict whitelist validation for GitHub repository names.
 * Blocks path traversal (..), slashes, spaces, and shell metacharacters.
 */
export function sanitizeRepoName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim();
  if (!cleaned || cleaned.length > 100) return null;
  if (cleaned === '.' || cleaned === '..' || cleaned.includes('..')) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Strict whitelist validation for Git branch names.
 */
export function sanitizeBranchName(raw: unknown): string {
  if (typeof raw !== 'string') return 'main';
  const cleaned = raw.trim();
  if (!cleaned || cleaned.length > 80 || cleaned.includes('..')) return 'main';
  if (!/^[a-zA-Z0-9._/-]+$/.test(cleaned)) return 'main';
  return cleaned;
}

/**
 * Generates an HMAC-SHA256 signed CSRF token bound to a session nonce.
 */
export function generateCsrfToken(sessionNonce: string, secret?: string): string {
  const key = deriveKey(secret);
  const mac = crypto.createHmac('sha256', key).update(sessionNonce).digest('base64url');
  return `${sessionNonce}.${mac}`;
}

/**
 * Verifies an HMAC-SHA256 signed CSRF token using constant-time comparison.
 */
export function verifyCsrfToken(
  token: string | undefined | null,
  expectedNonce: string | undefined | null,
  secret?: string
): boolean {
  if (!token || !expectedNonce || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [nonce, mac] = parts;
  if (nonce !== expectedNonce) return false;

  const expectedToken = generateCsrfToken(expectedNonce, secret);
  const expectedMac = expectedToken.split('.')[1];
  if (!expectedMac || mac.length !== expectedMac.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expectedMac));
  } catch {
    return false;
  }
}

/**
 * Sliding-window per-key rate limiter to prevent GitHub/Gemini API abuse.
 */
export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly hits = new Map<string, number[]>();

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public check(key: string, now: number = Date.now()): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
    limit: number;
  } {
    const windowStart = now - this.windowMs;
    const existing = (this.hits.get(key) || []).filter((ts) => ts > windowStart);

    if (existing.length >= this.maxRequests) {
      const oldest = existing[0] || now;
      this.hits.set(key, existing);
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(1000, oldest + this.windowMs - now),
        limit: this.maxRequests,
      };
    }

    existing.push(now);
    this.hits.set(key, existing);

    // Periodic cleanup if map grows large
    if (this.hits.size > 2000) {
      for (const [k, timestamps] of this.hits.entries()) {
        const active = timestamps.filter((ts) => ts > windowStart);
        if (active.length === 0) {
          this.hits.delete(k);
        } else {
          this.hits.set(k, active);
        }
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - existing.length),
      resetMs: this.windowMs,
      limit: this.maxRequests,
    };
  }
}

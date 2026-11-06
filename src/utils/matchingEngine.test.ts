import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateIssueMatch,
  rankAndFilterIssues,
  determineExperienceFromMergedPRs,
  determineExperienceClassification
} from './matchingEngine';
import {
  encodeYearBitmask,
  matchesSelectedYears
} from '../data/programs';
import {
  encryptSessionPayload,
  decryptSessionPayload,
  generateCsrfToken,
  verifyCsrfToken
} from './sessionCrypto';
import {
  LRUCache,
  SlidingWindowRateLimiter,
  computeSetupContentHash
} from '../../server/cache';
import { buildHeuristicSetupAnalysis } from '../../server/aiService';
import {
  DEFAULT_STUDENT_PROFILE,
  normalizeStudentProfile
} from '../constants/skills';
import { MOCK_GITHUB_ISSUES } from '../data/mockIssues';

describe('Bitmask Year Encoding (10-Bit GSoC Cohort Filter)', () => {
  it('encodes empty years as 0 and matches all masks', () => {
    assert.equal(encodeYearBitmask([]), 0);
    const orgMask = encodeYearBitmask([2024, 2025]);
    assert.equal(matchesSelectedYears(orgMask, 0), true);
  });

  it('correctly encodes 2016..2025 bits and performs O(1) intersection', () => {
    const orgMask = encodeYearBitmask([2016, 2020, 2025]);
    const filter2025 = encodeYearBitmask([2025]);
    const filter2022 = encodeYearBitmask([2022]);

    assert.equal(matchesSelectedYears(orgMask, filter2025), true);
    assert.equal(matchesSelectedYears(orgMask, filter2022), false);
  });
});

describe('Experience Level Classification & Transparency Notes', () => {
  it('classifies 0 merged PRs as First-Time Contributor with explanation', () => {
    assert.equal(determineExperienceFromMergedPRs(0), 'First-Time Contributor');
    const detail = determineExperienceClassification(0, false);
    assert.equal(detail.level, 'First-Time Contributor');
    assert.ok(detail.classificationNote.includes('0 merged public PRs'));
  });

  it('classifies 1-2 merged PRs as Familiar with Git', () => {
    assert.equal(determineExperienceFromMergedPRs(1), 'Familiar with Git');
    assert.equal(determineExperienceFromMergedPRs(2), 'Familiar with Git');
  });

  it('classifies 3+ merged PRs as Active Open-Source Contributor', () => {
    assert.equal(determineExperienceFromMergedPRs(3), 'Active Open-Source Contributor');
    assert.equal(determineExperienceFromMergedPRs(25), 'Active Open-Source Contributor');
  });
});

describe('Heuristic Skill-Fit Issue Matching Engine', () => {
  it('calculates higher match score for issues matching student languages and frameworks', () => {
    const tsIssue = MOCK_GITHUB_ISSUES.find((i) => i.language === 'TypeScript')!;
    const scored = calculateIssueMatch(tsIssue, DEFAULT_STUDENT_PROFILE);

    assert.ok(scored.matchScore && scored.matchScore >= 70);
    assert.ok(scored.matchBreakdown?.matchedSkills.includes('TypeScript'));
  });

  it('penalizes issues that are already assigned to another contributor', () => {
    const baseIssue = {
      ...MOCK_GITHUB_ISSUES[0],
      assigneeCount: 0
    };
    const assignedIssue = {
      ...MOCK_GITHUB_ISSUES[0],
      assigneeCount: 2
    };

    const unassignedScore = calculateIssueMatch(baseIssue, DEFAULT_STUDENT_PROFILE).matchScore!;
    const assignedScore = calculateIssueMatch(assignedIssue, DEFAULT_STUDENT_PROFILE).matchScore!;

    assert.ok(unassignedScore > assignedScore, 'Unassigned issue must score higher than assigned issue');
  });

  it('filters and sorts issues by language and search query', () => {
    const results = rankAndFilterIssues(
      MOCK_GITHUB_ISSUES,
      DEFAULT_STUDENT_PROFILE,
      '',
      'Python',
      false
    );

    assert.ok(results.length > 0);
    for (const issue of results) {
      assert.equal(issue.language, 'Python');
    }
  });

  it('normalizes legacy or malformed localStorage profiles missing skills.languages without crashing', () => {
    const legacyFlatProfile = {
      name: 'Legacy User',
      languages: ['Rust', 'Go'],
      frameworks: ['Docker']
    };
    const normalized = normalizeStudentProfile(legacyFlatProfile);
    assert.deepEqual(normalized.skills.languages, ['Rust', 'Go']);
    assert.deepEqual(normalized.skills.frameworks, ['Docker']);

    const emptyObjectProfile = normalizeStudentProfile({});
    assert.ok(Array.isArray(emptyObjectProfile.skills.languages));
    assert.ok(emptyObjectProfile.skills.languages.length > 0);

    const nullProfile = normalizeStudentProfile(null);
    assert.deepEqual(nullProfile, DEFAULT_STUDENT_PROFILE);

    // Ensure calculateIssueMatch also survives an unnormalized runtime object with missing skills
    const unnormalized = { name: 'Raw' } as unknown as typeof DEFAULT_STUDENT_PROFILE;
    const scored = calculateIssueMatch(MOCK_GITHUB_ISSUES[0], unnormalized);
    assert.ok(typeof scored.matchScore === 'number');
  });
});

describe('AES-256-GCM Session Crypto & CSRF Token Verification', () => {
  const testSecret = 'unit-test-secret-key-for-aes-256-gcm-and-hmac';

  it('encrypts and decrypts OAuth session payload without data loss', () => {
    const payload = {
      accessToken: 'gho_testToken12345',
      refreshToken: 'ghr_refresh67890',
      updatedAt: 1700000000000
    };

    const encrypted = encryptSessionPayload(payload, testSecret);
    assert.ok(!encrypted.includes('gho_testToken12345'));

    const decrypted = decryptSessionPayload<typeof payload>(encrypted, testSecret);
    assert.deepEqual(decrypted, payload);
  });

  it('rejects tampered ciphertext', () => {
    const payload = { accessToken: 'gho_secret', updatedAt: Date.now() };
    const encrypted = encryptSessionPayload(payload, testSecret);
    const tampered = encrypted.slice(0, -4) + 'AAAA';

    const decrypted = decryptSessionPayload(tampered, testSecret);
    assert.equal(decrypted, null);
  });

  it('generates and verifies HMAC-SHA256 CSRF tokens', () => {
    const subject = 'user-session-123';
    const token = generateCsrfToken(subject, testSecret);

    assert.equal(verifyCsrfToken(token, subject, testSecret), true);
    assert.equal(verifyCsrfToken(token, 'different-session', testSecret), false);
    assert.equal(verifyCsrfToken(token, subject, 'wrong-secret'), false);
  });
});

describe('Server LRU Cache, Rate Limiter & Grounded Heuristic AI Guide', () => {
  it('evicts oldest key when LRUCache exceeds capacity', () => {
    const cache = new LRUCache<string, number>(2, 60_000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
  });

  it('enforces sliding window rate limits accurately', () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 2);
    const r1 = limiter.check('ip-1');
    const r2 = limiter.check('ip-1');
    const r3 = limiter.check('ip-1');

    assert.equal(r1.allowed, true);
    assert.equal(r2.allowed, true);
    assert.equal(r3.allowed, false);
    assert.ok(r3.retryAfterSeconds >= 1);
  });

  it('builds a complete 12-part grounded onboarding guide from repository context', () => {
    const guide = buildHeuristicSetupAnalysis(
      'fastapi',
      'fastapi',
      {
        fullName: 'fastapi/fastapi',
        description: 'FastAPI framework, high performance, easy to learn',
        stars: 75000,
        forks: 6000,
        openIssues: 120,
        defaultBranch: 'master',
        license: 'MIT',
        language: 'Python',
        topics: ['fastapi', 'python', 'openapi'],
        htmlUrl: 'https://github.com/fastapi/fastapi',
        updatedAt: '2025-02-01T00:00:00Z',
        readmeSnippet: '# FastAPI\nInstall with pip',
        contributingSnippet: '# Contributing\nRun pytest before opening PR.',
        rootFiles: ['fastapi/', 'tests/', 'docs/', 'pyproject.toml', 'README.md', 'CONTRIBUTING.md'],
        manifestSummary: 'pyproject.toml: pytest, ruff, uvicorn'
      },
      'Clarify dependency injection docs for async generators',
      'Update tutorial section on yield dependencies'
    );

    assert.ok(guide.issueOverview.includes('Clarify dependency injection docs'));
    assert.ok(guide.whatToUnderstandFirst.length >= 2);
    assert.ok(guide.relevantFilesAndFolders.some((f) => f.includes('fastapi/')));
    assert.ok(guide.setup_commands.some((c) => c.includes('pyproject.toml') || c.includes('pip install')));
    assert.ok(guide.verifiedContextFiles.includes('README.md'));
    assert.ok(guide.verifiedContextFiles.includes('CONTRIBUTING.md'));
    assert.equal(guide.contextConfidence, 'high');

    const hash = computeSetupContentHash(
      'fastapi',
      'fastapi',
      '# FastAPI',
      '# Contributing',
      'pyproject.toml',
      'Clarify dependency injection docs'
    );
    assert.equal(hash.length, 64);
  });
});

import { GitHubIssue, StudentProfile, MatchBreakdown } from '../types';

/**
 * Classifies a student's open-source experience level based on verified merged pull requests
 * and returns both the classification and a transparent explanation note.
 */
export function determineExperienceClassification(mergedPrCount: number, exactGraphQL: boolean): {
  level: StudentProfile['experienceLevel'];
  classificationNote: string;
} {
  const sourceDesc = exactGraphQL
    ? 'verified via GitHub GraphQL contribution history'
    : 'derived from public pull request search (private repos and commit totals require GitHub OAuth)';

  if (mergedPrCount >= 3) {
    return {
      level: 'Active Open-Source Contributor',
      classificationNote: `${mergedPrCount} merged public PRs (${sourceDesc}). Classified as Active Open-Source Contributor (threshold: 3+ merged PRs).`
    };
  }
  if (mergedPrCount >= 1) {
    return {
      level: 'Familiar with Git',
      classificationNote: `${mergedPrCount} merged public PR${mergedPrCount === 1 ? '' : 's'} (${sourceDesc}). Classified as Familiar with Git (threshold: 1–2 merged PRs).`
    };
  }
  return {
    level: 'First-Time Contributor',
    classificationNote: `0 merged public PRs found (${sourceDesc}). Classified as First-Time Contributor—prioritizing well-documented beginner issues.`
  };
}

/**
 * Backwards-compatible helper returning the experience level string.
 */
export function determineExperienceFromMergedPRs(mergedPrCount: number): StudentProfile['experienceLevel'] {
  return determineExperienceClassification(mergedPrCount, true).level;
}

/**
 * Heuristic Skill-Fit & Onboarding Readiness Scoring Engine.
 * Evaluates an issue against a student's profile using transparent, multi-factor rules:
 * 1. Primary language alignment (up to 35 pts)
 * 2. Framework & tooling overlap (up to 25 pts)
 * 3. Beginner label & complexity fit for experience level (up to 20 pts)
 * 4. Issue description clarity & actionable context (up to 10 pts)
 * 5. Maintainer activity, comment load & unassigned availability (up to 10 pts)
 */
export function calculateIssueMatch(
  issue: GitHubIssue,
  profile: StudentProfile
): GitHubIssue {
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const reasons: string[] = [];

  const studentLangs = (profile?.skills?.languages ?? []).map((l) =>
    l.toLowerCase()
  );
  const studentFrameworks = (profile?.skills?.frameworks ?? []).map((f) =>
    f.toLowerCase()
  );
  const allStudentSkills = new Set([...studentLangs, ...studentFrameworks]);

  let score = 0;

  // 1. Primary Language Match (Weight: up to 35 points)
  const issueLangLower = (issue.language || '').toLowerCase();
  if (issueLangLower && allStudentSkills.has(issueLangLower)) {
    score += 35;
    matchedSkills.push(issue.language);
    reasons.push(`Matches your ${issue.language} coursework language (+35 heuristic pts)`);
  } else if (
    (issueLangLower === 'javascript' && allStudentSkills.has('typescript')) ||
    (issueLangLower === 'typescript' && allStudentSkills.has('javascript'))
  ) {
    score += 28;
    matchedSkills.push(`${issue.language} (JS/TS overlap)`);
    reasons.push(`Close language overlap with your JS/TS stack (+28 heuristic pts)`);
  } else if (issue.language && issue.language !== 'Unknown') {
    missingSkills.push(issue.language);
  }

  // 2. Framework & Tooling Overlap (Weight: up to 25 points)
  let frameworkMatches = 0;
  issue.requiredSkills.forEach((skill) => {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill === issueLangLower) return;

    if (allStudentSkills.has(lowerSkill)) {
      frameworkMatches++;
      if (!matchedSkills.includes(skill)) {
        matchedSkills.push(skill);
      }
    } else if (!missingSkills.includes(skill)) {
      missingSkills.push(skill);
    }
  });

  if (frameworkMatches > 0) {
    const frameworkScore = Math.min(frameworkMatches * 13, 25);
    score += frameworkScore;
    reasons.push(
      `Aligns with ${frameworkMatches} framework/tool skill${frameworkMatches > 1 ? 's' : ''} in your profile (+${frameworkScore} pts)`
    );
  } else if (issue.requiredSkills.length <= 1 && matchedSkills.length > 0) {
    // Pure language repository without extra framework barriers
    score += 12;
    reasons.push('Minimal external framework dependencies required (+12 pts)');
  }

  // 3. Beginner Label & Experience Level Alignment (Weight: up to 20 points)
  const beginnerLabelRegex = /good first issue|beginner|easy|starter|first-timers-only|low-hanging-fruit|documentation|docs/i;
  const intermediateLabelRegex = /help wanted|enhancement|bug|feature/i;

  const hasBeginnerLabel = issue.labels.some((l) => beginnerLabelRegex.test(l));
  const hasIntermediateLabel = issue.labels.some((l) => intermediateLabelRegex.test(l));

  if (profile.experienceLevel === 'First-Time Contributor') {
    if (hasBeginnerLabel) {
      score += 20;
      reasons.push('Verified beginner-friendly maintainer label for your first PR (+20 pts)');
    } else if (hasIntermediateLabel) {
      score += 10;
    }
  } else if (profile.experienceLevel === 'Familiar with Git') {
    if (hasBeginnerLabel || hasIntermediateLabel) {
      score += 18;
      reasons.push('Appropriate scope for a contributor familiar with Git workflows (+18 pts)');
    }
  } else {
    // Active Open-Source Contributor
    if (hasIntermediateLabel || issue.difficulty === 'Intermediate') {
      score += 20;
      reasons.push('Substantive engineering scope suited for an active contributor (+20 pts)');
    } else if (hasBeginnerLabel) {
      score += 15;
      reasons.push('Quick-win starter issue in this repository (+15 pts)');
    }
  }

  // 4. Issue Description Clarity & Actionable Context (Weight: up to 10 points)
  const summaryText = (issue.summary || '').trim();
  const hasClearDescription =
    summaryText.length >= 90 &&
    !summaryText.startsWith('No detailed description provided');

  if (hasClearDescription) {
    score += 10;
    reasons.push('Detailed problem description provided by maintainers (+10 pts)');
  } else if (summaryText.length >= 40 && !summaryText.startsWith('No detailed description provided')) {
    score += 5;
  } else {
    reasons.push('Brief issue body—check repository README and comments before starting');
  }

  // 5. Availability, Comment Contention & Mentorship Signal (Weight: up to 10 points)
  const isAssigned = issue.assigneeCount !== undefined && issue.assigneeCount > 0;
  if (isAssigned) {
    score = Math.max(15, score - 20);
    reasons.push('Already assigned to a contributor (-20 pts availability penalty)');
  } else if (issue.commentsCount <= 4) {
    score += 10;
    reasons.push(`Unassigned with low contention (${issue.commentsCount} comments) (+10 pts)`);
  } else if (issue.commentsCount <= 10) {
    score += 5;
    reasons.push(`Active discussion thread (${issue.commentsCount} comments—check if someone claimed it) (+5 pts)`);
  } else {
    reasons.push(`High comment volume (${issue.commentsCount} comments)—verify issue is still actionable`);
  }

  // Clamp final score between 15 and 99 (heuristic fit is never a guaranteed 100%)
  const finalScore = Math.min(Math.max(Math.round(score), 15), 99);

  // Estimate effort based on difficulty, missing skills, and comment thread complexity
  let estimatedEffort = issue.estimatedEffort || '2–4 hours';
  if (issue.labels.some((l) => /doc|typo|readme/i.test(l))) {
    estimatedEffort = '1–2 hours';
  } else if (missingSkills.length === 0 && hasBeginnerLabel && issue.commentsCount <= 5) {
    estimatedEffort = '2–4 hours';
  } else if (missingSkills.length <= 1) {
    estimatedEffort = '4–8 hours';
  } else {
    estimatedEffort = '1–2 weekends';
  }

  if (reasons.length === 0) {
    reasons.push('General open-source learning opportunity');
  }

  const matchBreakdown: MatchBreakdown = {
    score: finalScore,
    matchedSkills,
    missingSkills,
    reasons,
    isBeginnerFriendly: issue.difficulty === 'Beginner' || hasBeginnerLabel
  };

  return {
    ...issue,
    estimatedEffort,
    matchScore: finalScore,
    matchBreakdown
  };
}

export function rankAndFilterIssues(
  issues: GitHubIssue[],
  profile: StudentProfile,
  searchQuery: string = '',
  selectedLanguage: string = 'All',
  onlyHighMatch: boolean = false
): GitHubIssue[] {
  const scoredIssues = issues.map((issue) => calculateIssueMatch(issue, profile));

  return scoredIssues
    .filter((issue) => {
      if (selectedLanguage !== 'All' && issue.language !== selectedLanguage) {
        return false;
      }
      if (onlyHighMatch && (issue.matchScore || 0) < 60) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchRepo = issue.repoName.toLowerCase().includes(q);
        const matchSkills = issue.requiredSkills.some((s) => s.toLowerCase().includes(q));
        const matchLabels = issue.labels.some((l) => l.toLowerCase().includes(q));
        return matchTitle || matchRepo || matchSkills || matchLabels;
      }
      return true;
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

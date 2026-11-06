export type ExperienceLevel =
  | 'First-Time Contributor'
  | 'Familiar with Git'
  | 'Active Open-Source Contributor';

export interface StudentProfile {
  name: string;
  university: string;
  degree: string;
  githubUsername?: string;
  isPro?: boolean;
  experienceLevel: ExperienceLevel;
  skills: {
    languages: string[];
    frameworks: string[];
  };
  interests: string[];
  preferredDifficulty: 'Beginner' | 'Intermediate' | 'All';
  hasCompletedOnboarding: boolean;
}

export interface MatchBreakdown {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  isBeginnerFriendly: boolean;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  repoName: string;
  repoOwner: string;
  repoUrl: string;
  issueUrl: string;
  language: string;
  requiredSkills: string[];
  labels: string[];
  difficulty: 'Beginner' | 'Intermediate';
  estimatedEffort: string;
  summary: string;
  mentorAvailable: boolean;
  commentsCount: number;
  assigneeCount?: number;
  createdAt: string;
  updatedAt: string;
  setupSteps: string[];
  organizationType: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface LiveRepoContext {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  license: string;
  language: string;
  topics: string[];
  htmlUrl: string;
  updatedAt: string;
  readmeSnippet: string | null;
  contributingSnippet: string | null;
  rootFiles?: string[];
  manifestSummary?: string | null;
}

export interface AISetupAnalysis {
  issueOverview: string;
  whatToUnderstandFirst: string[];
  relevantFilesAndFolders: string[];
  architectureNotes: string;
  prerequisites: string[];
  setup_commands: string[];
  reproductionWorkflow: string[];
  implementationApproach: string[];
  testingInstructions: string[];
  contribution_rules: string[];
  verifiedContextFiles: string[];
  contextConfidence: 'high' | 'partial';
  contextNotice: string;
}

export interface LanguageTelemetry {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface ContributionTelemetry {
  totalCommitContributions: number | null;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  mergedPrCount: number;
  exactGraphQL: boolean;
}

export interface ProfileAnalysisResponse {
  username: string;
  avatarUrl: string;
  name: string;
  bio: string;
  publicRepos: number;
  followers: number;
  mergedPrCount: number;
  topLanguages: string[];
  languageBreakdown: LanguageTelemetry[];
  detectedFrameworks: string[];
  contributions: ContributionTelemetry;
  recommendedExperienceLevel: ExperienceLevel;
  classificationNote?: string;
  cached?: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  command?: string;
  completed: boolean;
}

export interface MentorshipProgram {
  id: string;
  name: string;
  shortName: 'GSoC' | 'LFX' | 'ESoC';
  organizer: string;
  stipendRange: string;
  applicationWindow: string;
  status: 'Upcoming' | 'Applications Open' | 'Active Cohort';
  description: string;
  officialUrl: string;
  eligibility: string;
}

export interface MentorshipOrganization {
  id: string;
  name: string;
  githubHandle: string;
  programs: ('GSoC' | 'LFX' | 'ESoC')[];
  category: string;
  yearsParticipated: number[];
  yearBitmask: number;
  description: string;
  techStack: string[];
  domain: string;
  beginnerIssuesCount: number;
  ideasListUrl: string;
  issuesUrl: string;
  mentorTip: string;
}

export interface OrgRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  beginnerIssueCount: number;
  beginnerCountVerified?: boolean;
  topics: string[];
  updatedAt: string;
  htmlUrl: string;
}

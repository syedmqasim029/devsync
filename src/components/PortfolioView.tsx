import React, { useEffect, useState, useMemo } from 'react';
import {
  Github,
  Award,
  GitPullRequest,
  GitCommit,
  Eye,
  Code2,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Building2,
  BarChart3,
  Loader2,
  GraduationCap,
  Terminal,
  Bookmark,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import {
  StudentProfile,
  ProfileAnalysisResponse,
  GitHubIssue
} from '../types';
import { MENTORSHIP_ORGANIZATIONS } from '../data/programs';
import { MOCK_GITHUB_ISSUES } from '../data/mockIssues';
import { rankAndFilterIssues } from '../utils/matchingEngine';
import {
  generateCertificateId,
  isCertificateUnlocked,
  loadAssessmentFromStorage,
  loadCompletedLessonsFromStorage
} from '../utils/gitCourseEngine';

interface PortfolioViewProps {
  username: string;
  profile: StudentProfile;
  savedIssues?: GitHubIssue[];
  onSelectIssue?: (issue: GitHubIssue) => void;
  onBack: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  username,
  profile,
  savedIssues = [],
  onSelectIssue,
  onBack
}) => {
  const [analysis, setAnalysis] = useState<ProfileAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const earnedCertification = useMemo(() => {
    const completedIds = loadCompletedLessonsFromStorage();
    const assessment = loadAssessmentFromStorage();
    if (!isCertificateUnlocked(completedIds, assessment) || !assessment) {
      return null;
    }
    const issuedIso =
      assessment.passedAt || assessment.lastAttemptAt || new Date().toISOString();
    const certId =
      assessment.certificateId ||
      generateCertificateId(
        username || profile.githubUsername || profile.name,
        issuedIso
      );
    return {
      certificateId: certId,
      bestScore: assessment.bestScore,
      issuedDate: new Date(issuedIso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      recipientName: assessment.studentName || profile.name
    };
  }, [username, profile.githubUsername, profile.name]);

  useEffect(() => {
    let isMounted = true;
    const targetUser = (username || profile.githubUsername || 'torvalds')
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .trim();

    setIsLoading(true);
    setErrorMessage(null);
    fetch(
      `/api/github/analyze-profile?username=${encodeURIComponent(targetUser)}`,
      { credentials: 'include' }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!isMounted) return;
        if (res.ok && !data.error) {
          setAnalysis(data as ProfileAnalysisResponse);
        } else {
          setAnalysis(null);
          setErrorMessage(
            data.error || `GitHub user "@${targetUser}" could not be found.`
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setAnalysis(null);
          setErrorMessage(
            'Unable to reach GitHub API to load live portfolio telemetry.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, profile.githubUsername]);

  const effectiveLanguages = useMemo(() => {
    if (analysis?.topLanguages && analysis.topLanguages.length > 0) {
      return analysis.topLanguages;
    }
    return profile?.skills?.languages ?? ['TypeScript'];
  }, [analysis, profile?.skills?.languages]);

  const effectiveFrameworks = useMemo(() => {
    const baseFrameworks = profile?.skills?.frameworks ?? [];
    if (analysis?.detectedFrameworks && analysis.detectedFrameworks.length > 0) {
      return Array.from(
        new Set([...analysis.detectedFrameworks, ...baseFrameworks])
      );
    }
    return baseFrameworks;
  }, [analysis, profile?.skills?.frameworks]);

  // Top 4 Matched GSoC Organizations
  const topMatchedOrgs = useMemo(() => {
    const skillSet = new Set(
      [...effectiveLanguages, ...effectiveFrameworks].map((s) => s.toLowerCase())
    );
    return MENTORSHIP_ORGANIZATIONS.map((org) => {
      const matched = org.techStack.filter((t) =>
        skillSet.has(t.toLowerCase())
      );
      const score = Math.min(
        Math.round((matched.length / Math.max(org.techStack.length * 0.6, 1)) * 100),
        99
      );
      return {
        ...org,
        matched,
        score: matched.length > 0 ? Math.max(score, 55) : 20
      };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [effectiveLanguages, effectiveFrameworks]);

  // Top 3 Matched Issues
  const topIssues = useMemo(() => {
    return rankAndFilterIssues(MOCK_GITHUB_ISSUES, {
      ...profile,
      skills: {
        languages: effectiveLanguages,
        frameworks: effectiveFrameworks
      }
    }).slice(0, 3);
  }, [profile, effectiveLanguages, effectiveFrameworks]);

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issue Feed</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-display font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified Open-Source Readiness Portfolio
          </span>
          <button
            onClick={handleCopyShareUrl}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Portfolio URL Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Share Portfolio URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Portfolio Card */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
        {/* Hero Header */}
        <div className="p-6 sm:p-10 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {analysis?.avatarUrl ? (
              <img
                src={analysis.avatarUrl}
                alt={analysis.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl border-2 border-blue-600/30 object-cover shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-display font-extrabold shadow-sm">
                {(analysis?.name || profile.name).charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                  {analysis?.name || profile.name}
                </h1>
                <span className="px-3 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {analysis?.recommendedExperienceLevel || profile.experienceLevel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  {profile.university} • {profile.degree}
                </span>
                {analysis?.username && (
                  <a
                    href={`https://github.com/${analysis.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono font-semibold"
                  >
                    <Github className="w-3.5 h-3.5" />@{analysis.username}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {analysis?.bio && (
                <p className="text-xs sm:text-sm text-slate-700 pt-1 max-w-xl">
                  {analysis.bio}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching GitHub Telemetry...</span>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto font-mono tabular-nums">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-lg">
                  <GitCommit className="w-4 h-4 text-emerald-600" />
                  {analysis.contributions.totalCommitContributions !== null
                    ? analysis.contributions.totalCommitContributions.toLocaleString()
                    : 'OAuth'}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  {analysis.contributions.totalCommitContributions !== null
                    ? 'Commits'
                    : 'Commit Graph'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-lg">
                  <GitPullRequest className="w-4 h-4 text-blue-600" />
                  {analysis.mergedPrCount}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  Merged PRs
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-amber-800 font-bold text-lg">
                  <Eye className="w-4 h-4 text-amber-600" />
                  {analysis.contributions.exactGraphQL
                    ? analysis.contributions.totalPullRequestReviewContributions
                    : analysis.publicRepos}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  {analysis.contributions.exactGraphQL ? 'Reviews' : 'Public Repos'}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Body Sections */}
        <div className="p-6 sm:p-10 space-y-8 bg-white">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900">
                  Live GitHub Handle Notice
                </span>
                <span>
                  {errorMessage} Displaying coursework stack from local student profile.
                </span>
              </div>
            </div>
          )}

          {/* Row 1: Language Byte Breakdown + Verified Frameworks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Verified Language Distribution
              </h2>

              {analysis?.languageBreakdown &&
              analysis.languageBreakdown.length > 0 ? (
                <div className="space-y-3">
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex border border-slate-300">
                    {analysis.languageBreakdown.map((l) => (
                      <div
                        key={l.name}
                        style={{
                          width: `${Math.max(l.percentage, 4)}%`,
                          backgroundColor: l.color
                        }}
                        className="h-full"
                        title={`${l.name}: ${l.percentage}%`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {analysis.languageBreakdown.map((l) => (
                      <div
                        key={l.name}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200"
                      >
                        <span className="flex items-center gap-2 text-[#0A0A0A] font-semibold">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: l.color }}
                          />
                          {l.name}
                        </span>
                        <span className="font-mono font-semibold text-slate-700 tabular-nums">
                          {l.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {effectiveLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Frameworks, Tools &amp; Domain Focus
              </h2>
              <div className="flex flex-wrap gap-2">
                {effectiveFrameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#0A0A0A] border border-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {fw}
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Engineering Interests:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-0.5 rounded-md bg-white text-slate-700 text-[11px] font-medium border border-slate-300"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Saved Target Issues (If user bookmarked any issues) */}
          {savedIssues.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <Bookmark className="w-4 h-4 fill-amber-600 text-amber-600" />
                Saved Target Issues ({savedIssues.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedIssues.slice(0, 6).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue && onSelectIssue(issue)}
                    className="p-4 rounded-2xl bg-amber-50/40 hover:bg-amber-50 border border-amber-300 transition-all flex flex-col justify-between space-y-3 cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-700 truncate">
                          {issue.repoName}
                        </span>
                        <span className="text-emerald-700 font-bold font-mono tabular-nums">
                          {issue.matchScore}% Fit
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-[#0A0A0A] line-clamp-2">
                        {issue.title}
                      </h3>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <span>Open AI Setup Guide</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Certifications Section */}
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Certifications
            </h2>
            {earnedCertification ? (
              <div
                data-testid="portfolio-certification-card"
                className="p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-extrabold text-[#0A0A0A]">
                        DevSync Git &amp; Open-Source Contribution Certification
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-mono font-bold tabular-nums">
                        {earnedCertification.bestScore}% Exam Score
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Completed all 5 Levels (33 Interactive Modules) &amp; Final Assessment • Issued to{' '}
                      <strong className="text-[#0A0A0A]">
                        {earnedCertification.recipientName}
                      </strong>{' '}
                      on {earnedCertification.issuedDate}
                    </p>
                    <div className="text-xs font-mono font-bold text-blue-700">
                      Credential ID: {earnedCertification.certificateId}
                    </div>
                  </div>
                </div>
                <a
                  href="/learn"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 self-start sm:self-center shrink-0 shadow-2xs"
                >
                  <span>View Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-700">
                  <strong className="text-[#0A0A0A] block font-display">
                    DevSync Git &amp; Open-Source Contribution Certification (In Progress)
                  </strong>
                  <span>
                    Complete the 5-Level Git Curriculum (33 Lessons) and pass the Final Assessment (≥80%) to display your verified credential here.
                  </span>
                </div>
                <a
                  href="/learn"
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-bold shrink-0"
                >
                  Open Course
                </a>
              </div>
            )}
          </div>

          {/* Row 2: Top Matched GSoC / LFX Mentorship Organizations */}
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Top Recommended GSoC / LFX Mentorship Organizations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topMatchedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display font-bold text-[#0A0A0A] text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        {org.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono tabular-nums">
                        {org.score}% Stack Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2">
                      {org.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {org.techStack.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-slate-700 border border-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Recommended Starter Issues */}
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Recommended First Pull Request Targets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topIssues.map((issue) => (
                <a
                  key={issue.id}
                  href={issue.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-700 truncate">
                        {issue.repoName}
                      </span>
                      <span className="text-emerald-700 font-bold font-mono tabular-nums">
                        {issue.matchScore}% Fit
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0A0A0A] line-clamp-2">
                      {issue.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-200">
                    <span>{issue.language}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      View Issue <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Stamp */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>
              Generated by <strong className="text-[#0A0A0A]">DevSync</strong> — Open-Source Contribution &amp; Mentorship Platform
            </span>
          </div>
          <span className="font-medium">Verified via GitHub REST &amp; GraphQL Telemetry</span>
        </div>
      </div>
    </div>
  );
};

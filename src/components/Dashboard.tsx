import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  GitFork,
  ArrowUpRight,
  SlidersHorizontal,
  ShieldCheck,
  Code2,
  Layers,
  RefreshCw,
  Wifi,
  Database,
  Github,
  Loader2,
  Share2,
  BarChart3,
  GitPullRequest,
  GitCommit,
  Eye,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Info
} from 'lucide-react';
import {
  GitHubIssue,
  StudentProfile,
  ProfileAnalysisResponse
} from '../types';
import { rankAndFilterIssues } from '../utils/matchingEngine';
import { AVAILABLE_LANGUAGES } from '../constants/skills';

interface DashboardProps {
  profile: StudentProfile;
  issues: GitHubIssue[];
  savedIssues: GitHubIssue[];
  savedIssueIds: Set<string>;
  onToggleSaveIssue: (issue: GitHubIssue) => void;
  isLoadingIssues: boolean;
  isLiveGitHubData: boolean;
  onRefreshIssues: (language: string) => void;
  onSelectIssue: (issue: GitHubIssue) => void;
  onEditProfile: () => void;
  onUpdateProfile?: (profile: StudentProfile) => void;
  onOpenPortfolio?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  issues,
  savedIssues,
  savedIssueIds,
  onToggleSaveIssue,
  isLoadingIssues,
  isLiveGitHubData,
  onRefreshIssues,
  onSelectIssue,
  onEditProfile,
  onUpdateProfile,
  onOpenPortfolio
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [onlyHighMatch, setOnlyHighMatch] = useState<boolean>(false);
  const [onlyBeginner, setOnlyBeginner] = useState<boolean>(false);
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState<boolean>(false);

  // Automated GitHub Profile Analyzer State (100% Free for All Students)
  const [githubUsername, setGithubUsername] = useState<string>(
    profile.githubUsername || ''
  );
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState<boolean>(false);
  const [profileAnalysisResult, setProfileAnalysisResult] =
    useState<ProfileAnalysisResponse | null>(null);
  const [profileAnalysisError, setProfileAnalysisError] = useState<string | null>(
    null
  );

  const handleAnalyzeGitHubProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = githubUsername
      .trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .trim();

    if (!cleanInput) {
      setProfileAnalysisError('Please enter a GitHub username to analyze.');
      return;
    }

    setIsAnalyzingProfile(true);
    setProfileAnalysisError(null);
    try {
      const res = await fetch(
        `/api/github/analyze-profile?username=${encodeURIComponent(cleanInput)}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        setProfileAnalysisResult(null);
        setProfileAnalysisError(
          data.error ||
            `Could not analyze "@${cleanInput}". Verify the GitHub handle exists and try again.`
        );
        return;
      }

      const resultData = data as ProfileAnalysisResponse;
      setProfileAnalysisResult(resultData);

      if (onUpdateProfile) {
        const currentLanguages = profile?.skills?.languages ?? [];
        const currentFrameworks = profile?.skills?.frameworks ?? [];

        const mergedLangs = Array.from(
          new Set([
            ...(resultData.topLanguages || []),
            ...currentLanguages
          ])
        ).slice(0, 6);

        const mergedFrameworks = Array.from(
          new Set([
            ...(resultData.detectedFrameworks || []),
            ...currentFrameworks
          ])
        ).slice(0, 8);

        onUpdateProfile({
          ...profile,
          name: resultData.name || profile.name,
          githubUsername: resultData.username || cleanInput,
          experienceLevel:
            resultData.recommendedExperienceLevel || profile.experienceLevel,
          skills: {
            ...profile.skills,
            languages:
              mergedLangs.length > 0 ? mergedLangs : currentLanguages,
            frameworks: mergedFrameworks
          }
        });
      }
    } catch {
      setProfileAnalysisResult(null);
      setProfileAnalysisError(
        'Network error while contacting the profile analyzer endpoint. Please check your connection and try again.'
      );
    } finally {
      setIsAnalyzingProfile(false);
    }
  };

  const handleLanguageFilterChange = (lang: string) => {
    setSelectedLanguage(lang);
    onRefreshIssues(lang);
  };

  const activeIssuePool = onlySaved ? savedIssues : issues;

  const rankedIssues = useMemo(() => {
    const list = rankAndFilterIssues(
      activeIssuePool,
      profile,
      searchQuery,
      selectedLanguage,
      onlyHighMatch
    );
    if (onlyBeginner) {
      return list.filter((i) => i.matchBreakdown?.isBeginnerFriendly);
    }
    return list;
  }, [
    activeIssuePool,
    profile,
    searchQuery,
    selectedLanguage,
    onlyHighMatch,
    onlyBeginner
  ]);

  const strongMatchesCount = useMemo(() => {
    return rankedIssues.filter((i) => (i.matchScore || 0) >= 75).length;
  }, [rankedIssues]);

  const profileLanguages = profile?.skills?.languages ?? [];
  const profileFrameworks = profile?.skills?.frameworks ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Compact Workspace Summary Bar */}
      <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-display font-bold text-sm shadow-2xs">
              {(profile?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-lg font-extrabold text-[#0A0A0A]">
                  {profile.name}&apos;s Contribution Workspace
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  {profile.experienceLevel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    isLiveGitHubData
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {isLiveGitHubData ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-600" />
                      Live GitHub API
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 text-amber-600" />
                      Curated Issue Dataset
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-medium text-slate-600">Active Stack:</span>
                {profileLanguages.slice(0, 4).map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded bg-slate-100 text-[#0A0A0A] border border-slate-300 text-[11px] font-semibold"
                  >
                    {lang}
                  </span>
                ))}
                {profileFrameworks.slice(0, 3).map((fw) => (
                  <span
                    key={fw}
                    className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                setIsWorkspaceExpanded((prev) => !prev)
              }
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 text-blue-600" />
              <span>GitHub Profile Analyzer</span>
              {isWorkspaceExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {onOpenPortfolio && (
              <button
                onClick={onOpenPortfolio}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Public Portfolio</span>
              </button>
            )}

            <button
              onClick={onEditProfile}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Skills</span>
            </button>

            <button
              onClick={() => onRefreshIssues(selectedLanguage)}
              disabled={isLoadingIssues}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh GitHub Issues"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  isLoadingIssues ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Collapsible Automated GitHub Profile Analyzer Drawer (100% Free) */}
        {isWorkspaceExpanded && (
          <div className="px-4 pb-5 pt-4 sm:px-6 border-t border-slate-200 bg-slate-50/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-display font-bold text-[#0A0A0A]">
                  <Github className="w-4 h-4 text-blue-600" />
                  <span>Automated GitHub Profile &amp; Skill Analyzer</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-semibold">
                    Free Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  Enter any public GitHub username to compute verified language byte percentages, merged pull request history, and experience classification.
                </p>
              </div>

              <form
                onSubmit={handleAnalyzeGitHubProfile}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g., torvalds, gaearon, or your handle"
                  className="w-full md:w-64 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={isAnalyzingProfile || !githubUsername.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-display font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  {isAnalyzingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze Handle</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {profileAnalysisError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-xs text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-red-800">
                    GitHub Profile Analysis Error
                  </span>
                  <span>{profileAnalysisError}</span>
                </div>
              </div>
            )}

            {profileAnalysisResult && (
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Verified <strong className="text-[#0A0A0A]">@{profileAnalysisResult.username}</strong>:{' '}
                      {profileAnalysisResult.publicRepos} public repos •{' '}
                      <strong className="text-[#0A0A0A]">{profileAnalysisResult.mergedPrCount} merged PRs</strong> →{' '}
                      <span className="underline decoration-emerald-600 font-bold text-emerald-800">
                        {profileAnalysisResult.recommendedExperienceLevel}
                      </span>
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300 text-[11px] text-slate-700 font-mono">
                    Source: {profileAnalysisResult.contributions.exactGraphQL ? 'GitHub GraphQL API' : 'GitHub Public REST + Languages API'}
                  </span>
                </div>

                {profileAnalysisResult.classificationNote && (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center gap-2 text-[11px] text-slate-800">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{profileAnalysisResult.classificationNote}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Language Byte Breakdown */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        Repository Language Distribution (By Byte Size)
                      </span>
                    </div>

                    {profileAnalysisResult.languageBreakdown.length > 0 ? (
                      <>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex mb-2.5 border border-slate-300">
                          {profileAnalysisResult.languageBreakdown.map((lang) => (
                            <div
                              key={lang.name}
                              style={{
                                width: `${Math.max(lang.percentage, 3)}%`,
                                backgroundColor: lang.color
                              }}
                              title={`${lang.name}: ${lang.percentage}% (${lang.bytes.toLocaleString()} bytes)`}
                              className="h-full transition-all"
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {profileAnalysisResult.languageBreakdown.map((lang) => (
                            <div
                              key={lang.name}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                                style={{ backgroundColor: lang.color }}
                              />
                              <span className="text-[#0A0A0A] font-semibold">
                                {lang.name}
                              </span>
                              <span className="text-slate-600 font-mono text-[11px] tabular-nums">
                                {lang.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600">
                        No language code bytes detected in public non-fork repositories.
                      </p>
                    )}
                  </div>

                  {/* Contribution Telemetry */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs mb-0.5">
                        <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-sm tabular-nums">
                          {profileAnalysisResult.contributions.totalCommitContributions !== null
                            ? profileAnalysisResult.contributions.totalCommitContributions.toLocaleString()
                            : 'OAuth Req.'}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                        {profileAnalysisResult.contributions.totalCommitContributions !== null
                          ? 'Annual Commits'
                          : 'Commit Graph'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-center gap-1 text-blue-700 text-xs mb-0.5">
                        <GitPullRequest className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-mono font-bold text-sm tabular-nums">
                          {profileAnalysisResult.mergedPrCount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                        Merged Public PRs
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-center gap-1 text-amber-800 text-xs mb-0.5">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-mono font-bold text-sm tabular-nums">
                          {profileAnalysisResult.contributions.exactGraphQL
                            ? profileAnalysisResult.contributions.totalPullRequestReviewContributions.toLocaleString()
                            : profileAnalysisResult.publicRepos.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                        {profileAnalysisResult.contributions.exactGraphQL
                          ? 'PR Reviews'
                          : 'Public Repos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues by title, repository, label, or skill (e.g., React, FastAPI, accessibility)..."
            className="w-full pl-12 pr-20 py-3 rounded-xl bg-white border border-slate-300 text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 shadow-2xs">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-600">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageFilterChange(e.target.value)}
              aria-label="Filter by programming language"
              className="bg-transparent text-sm text-[#0A0A0A] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-white text-[#0A0A0A]">
                All Languages
              </option>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-white text-[#0A0A0A]">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* High Skill-Fit Toggle */}
          <button
            onClick={() => setOnlyHighMatch(!onlyHighMatch)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-display font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyHighMatch
                ? 'bg-blue-600 border-blue-700 text-white shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0A0A0A]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${onlyHighMatch ? 'text-white' : 'text-blue-600'}`} />
            <span>High Skill Fit (60%+)</span>
          </button>

          {/* Beginner Friendly Toggle */}
          <button
            onClick={() => setOnlyBeginner(!onlyBeginner)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-display font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyBeginner
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0A0A0A]'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${onlyBeginner ? 'text-white' : 'text-emerald-600'}`} />
            <span>Verified Beginner</span>
          </button>

          {/* Saved / Bookmarked Issues Toggle */}
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-display font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlySaved
                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0A0A0A]'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                onlySaved ? 'fill-amber-600 text-amber-600' : 'text-amber-600'
              }`}
            />
            <span>Saved ({savedIssues.length})</span>
          </button>
        </div>
      </div>

      {/* Feed Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
        <div className="text-xs text-slate-700 flex items-center gap-2">
          <span>
            Showing <strong className="text-[#0A0A0A] font-mono font-bold tabular-nums">{rankedIssues.length}</strong>{' '}
            {onlySaved ? 'saved' : 'ranked'} issues ({strongMatchesCount} strong skill-fit matches)
          </span>
        </div>
        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Scores represent a multi-factor <strong className="text-[#0A0A0A]">Heuristic Skill-Fit</strong> (language, frameworks, labels, clarity &amp; contention).
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingIssues ? (
        <div className="grid grid-cols-1 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-2xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-28 h-6 bg-slate-200 rounded-lg"></div>
                <div className="w-36 h-5 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="w-3/4 h-6 bg-slate-200 rounded-lg mb-3"></div>
              <div className="w-full h-12 bg-slate-100 rounded-lg mb-4"></div>
              <div className="flex gap-2">
                <div className="w-20 h-6 bg-slate-200 rounded-md"></div>
                <div className="w-20 h-6 bg-slate-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : rankedIssues.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-[#0A0A0A] mb-2">
            {onlySaved
              ? 'No saved issues match your current filters'
              : 'No matching issues found'}
          </h3>
          <p className="text-slate-700 text-sm max-w-md mx-auto mb-6">
            {onlySaved
              ? 'Bookmark issues from the main feed or mentorship explorer to track them here.'
              : 'Try broadening your search query, selecting "All Languages", or disabling the High Skill Fit filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('All');
              setOnlyHighMatch(false);
              setOnlyBeginner(false);
              setOnlySaved(false);
              onRefreshIssues('All');
            }}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-sm font-display font-semibold transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {rankedIssues.map((issue) => {
            const score = issue.matchScore || 0;
            const breakdown = issue.matchBreakdown;
            const isSaved = savedIssueIds.has(issue.id);

            let badgeColor =
              'bg-slate-100 text-slate-800 border-slate-300';
            if (score >= 80) {
              badgeColor =
                'bg-emerald-50 text-emerald-800 border-emerald-300';
            } else if (score >= 60) {
              badgeColor =
                'bg-blue-50 text-blue-800 border-blue-300';
            } else if (score >= 40) {
              badgeColor =
                'bg-amber-50 text-amber-900 border-amber-300';
            }

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="group relative p-6 rounded-2xl bg-white hover:bg-slate-50/40 border border-slate-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Content */}
                  <div className="flex-1 space-y-3">
                    {/* Top Meta Row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 font-mono tabular-nums ${badgeColor}`}
                        title="Heuristic Skill-Fit Score based on coursework languages, frameworks, labels, and issue clarity"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {score}% Skill Fit
                      </span>

                      <span className="text-xs font-mono font-semibold text-[#0A0A0A] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-slate-600" />
                        {issue.repoName}
                        <span className="text-slate-600">#{issue.number}</span>
                      </span>

                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {issue.organizationType}
                      </span>

                      {issue.mentorAvailable && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active Discussion
                        </span>
                      )}
                    </div>

                    {/* Issue Title */}
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] group-hover:text-blue-700 transition-colors flex items-start gap-2">
                      <span>{issue.title}</span>
                      <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0 mt-1" />
                    </h2>

                    {/* Plain-English Summary */}
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {issue.summary}
                    </p>

                    {/* Skill Tags & Labels */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 mr-1">
                        <Code2 className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-600">Skills:</span>
                      </div>
                      {issue.requiredSkills.map((skill) => {
                        const isMatched = breakdown?.matchedSkills.some(
                          (m) =>
                            m.toLowerCase().includes(skill.toLowerCase()) ||
                            skill.toLowerCase().includes(m.toLowerCase())
                        );
                        return (
                          <span
                            key={skill}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {isMatched && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {skill}
                          </span>
                        );
                      })}

                      <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                      {issue.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Box: Match Explanation + Bookmark + Action */}
                  <div className="lg:w-80 shrink-0 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-display font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          Why This Fits Your Stack
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveIssue(issue);
                          }}
                          title={isSaved ? 'Remove from Saved Issues' : 'Save Issue for Later'}
                          aria-label={isSaved ? 'Remove from Saved Issues' : 'Save Issue for Later'}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-amber-100 border-amber-400 text-amber-900 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                              : 'bg-white border-slate-300 text-slate-600 hover:text-[#0A0A0A] hover:bg-slate-100'
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-amber-600 text-amber-600' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {breakdown?.reasons.slice(0, 3).map((reason, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 flex items-start gap-2"
                          >
                            <span className="text-blue-600 font-bold mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Est. {issue.estimatedEffort}
                      </span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        {issue.commentsCount} comments
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue(issue);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 font-display font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open AI Onboarding Guide</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

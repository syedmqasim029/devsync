import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Award,
  Search,
  ExternalLink,
  Calendar,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Code2,
  Filter,
  ArrowUpRight,
  Building2,
  GraduationCap,
  DollarSign,
  Globe,
  Layers,
  ChevronLeft,
  ChevronRight,
  GitFork,
  Star,
  AlertCircle,
  Loader2,
  FolderGit2,
  ArrowLeft,
  MessageSquare,
  Clock,
  Lock,
  Bookmark,
  History
} from 'lucide-react';
import {
  StudentProfile,
  MentorshipOrganization,
  OrgRepository,
  GitHubIssue
} from '../types';
import {
  MENTORSHIP_PROGRAMS,
  MENTORSHIP_ORGANIZATIONS,
  GSOC_AVAILABLE_YEARS,
  GSOC_CATEGORIES,
  encodeYearBitmask,
  matchesSelectedYears
} from '../data/programs';
import { calculateIssueMatch } from '../utils/matchingEngine';

interface MentorshipExplorerProps {
  profile: StudentProfile;
  savedIssueIds?: Set<string>;
  onToggleSaveIssue?: (issue: GitHubIssue) => void;
  onSelectIssue?: (issue: GitHubIssue) => void;
}

const ITEMS_PER_PAGE = 24;

export const MentorshipExplorer: React.FC<MentorshipExplorerProps> = ({
  profile,
  savedIssueIds,
  onToggleSaveIssue,
  onSelectIssue
}) => {
  // Drill-Down Navigation State (Step 1: Orgs -> Step 2: Repos -> Step 3: Beginner Issues)
  const [selectedOrg, setSelectedOrg] = useState<MentorshipOrganization | null>(
    null
  );
  const [orgRepos, setOrgRepos] = useState<OrgRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);

  const [selectedRepo, setSelectedRepo] = useState<OrgRepository | null>(null);
  const [repoIssues, setRepoIssues] = useState<GitHubIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState<boolean>(false);

  // AbortControllers for race condition protection
  const orgReposAbortRef = useRef<AbortController | null>(null);
  const repoIssuesAbortRef = useRef<AbortController | null>(null);

  // Filter States (Step 1)
  const [selectedProgram, setSelectedProgram] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [onlyMatchedToMe, setOnlyMatchedToMe] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 300ms Debounce on Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    return () => {
      orgReposAbortRef.current?.abort();
      repoIssuesAbortRef.current?.abort();
    };
  }, []);

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
    setCurrentPage(1);
  };

  const selectedYearsMask = useMemo(
    () => encodeYearBitmask(selectedYears),
    [selectedYears]
  );

  // Drill-down handler: Select an Organization -> Fetch its Repositories
  const handleSelectOrg = async (org: MentorshipOrganization) => {
    orgReposAbortRef.current?.abort();
    const controller = new AbortController();
    orgReposAbortRef.current = controller;

    setSelectedOrg(org);
    setSelectedRepo(null);
    setRepoIssues([]);
    setIsLoadingRepos(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(
        `/api/github/org-repos?org=${encodeURIComponent(
          org.githubHandle
        )}&name=${encodeURIComponent(org.name)}`,
        { signal: controller.signal, credentials: 'include' }
      );
      const data = await res.json();
      if (!controller.signal.aborted) {
        setOrgRepos(data.repos || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to load org repositories:', err);
      setOrgRepos([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingRepos(false);
      }
    }
  };

  // Drill-down handler: Select a Repository -> Fetch its Beginner Issues
  const handleSelectRepo = async (repo: OrgRepository) => {
    repoIssuesAbortRef.current?.abort();
    const controller = new AbortController();
    repoIssuesAbortRef.current = controller;

    setSelectedRepo(repo);
    setIsLoadingIssues(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const parts = repo.fullName.split('/');
    const owner = parts[0] || selectedOrg?.githubHandle || '';
    const repoName = parts[1] || repo.name;

    try {
      const res = await fetch(
        `/api/github/repo-issues?owner=${encodeURIComponent(
          owner
        )}&repo=${encodeURIComponent(repoName)}`,
        { signal: controller.signal, credentials: 'include' }
      );
      const data = await res.json();
      if (!controller.signal.aborted) {
        const rawIssues: GitHubIssue[] = data.issues || [];
        const scored = rawIssues
          .map((issue) => calculateIssueMatch(issue, profile))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setRepoIssues(scored);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to load repository issues:', err);
      setRepoIssues([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingIssues(false);
      }
    }
  };

  // Score and filter organizations against student's profile and selected filters
  const scoredOrgs = useMemo(() => {
    const studentSkills = new Set(
      [
        ...(profile?.skills?.languages ?? []),
        ...(profile?.skills?.frameworks ?? [])
      ].map((s) => s.toLowerCase())
    );

    return MENTORSHIP_ORGANIZATIONS.map((org) => {
      const matchedTech = org.techStack.filter((tech) =>
        studentSkills.has(tech.toLowerCase())
      );
      const matchPercentage = Math.min(
        Math.round(
          (matchedTech.length / Math.max(org.techStack.length * 0.6, 1)) * 100
        ),
        99
      );

      return {
        ...org,
        matchedTech,
        matchPercentage:
          matchedTech.length > 0 ? Math.max(matchPercentage, 45) : 15
      };
    })
      .filter((org) => {
        if (
          selectedProgram !== 'All' &&
          !org.programs.includes(selectedProgram as 'GSoC' | 'LFX' | 'ESoC')
        ) {
          return false;
        }
        if (selectedCategory !== 'All' && org.category !== selectedCategory) {
          return false;
        }
        if (!matchesSelectedYears(org.yearBitmask, selectedYearsMask)) {
          return false;
        }
        if (onlyMatchedToMe && org.matchedTech.length === 0) {
          return false;
        }
        if (debouncedSearchQuery.trim() !== '') {
          const q = debouncedSearchQuery.toLowerCase();
          const nameMatch = org.name.toLowerCase().includes(q);
          const descMatch = org.description.toLowerCase().includes(q);
          const techMatch = org.techStack.some((t) =>
            t.toLowerCase().includes(q)
          );
          const domainMatch = org.domain.toLowerCase().includes(q);
          const catMatch = org.category.toLowerCase().includes(q);
          return nameMatch || descMatch || techMatch || domainMatch || catMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return b.yearsParticipated.length - a.yearsParticipated.length;
      });
  }, [
    profile,
    selectedProgram,
    selectedCategory,
    selectedYearsMask,
    debouncedSearchQuery,
    onlyMatchedToMe
  ]);

  const totalPages = Math.max(1, Math.ceil(scoredOrgs.length / ITEMS_PER_PAGE));
  const paginatedOrgs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return scoredOrgs.slice(start, start + ITEMS_PER_PAGE);
  }, [scoredOrgs, currentPage]);

  const resetAllFilters = () => {
    setSelectedProgram('All');
    setSelectedCategory('All');
    setSelectedYears([]);
    setSearchInput('');
    setDebouncedSearchQuery('');
    setOnlyMatchedToMe(false);
    setCurrentPage(1);
  };

  // ============================================================================
  // RENDER STEP 3: BEGINNER ISSUES INSIDE SELECTED REPOSITORY
  // ============================================================================
  if (selectedOrg && selectedRepo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              onClick={() => {
                setSelectedOrg(null);
                setSelectedRepo(null);
              }}
              className="text-slate-600 hover:text-[#0A0A0A] font-medium transition-colors cursor-pointer"
            >
              505 GSoC Orgs
            </button>
            <span className="text-slate-400">/</span>
            <button
              onClick={() => setSelectedRepo(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
            >
              {selectedOrg.name}
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-[#0A0A0A] font-bold font-mono">
              {selectedRepo.name}
            </span>
          </div>

          <button
            onClick={() => setSelectedRepo(null)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {selectedOrg.name} Projects</span>
          </button>
        </div>

        {/* Selected Repository Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  Step 3 of 3: Select an Open Issue
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-[#0A0A0A] border border-slate-300">
                  {selectedRepo.fullName}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedRepo.language}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Open Issues in {selectedRepo.name}
              </h1>
              <p className="text-slate-700 text-sm max-w-3xl">
                {selectedRepo.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-lg font-bold text-amber-700 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {selectedRepo.stars.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase">Stars</div>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-lg font-bold text-emerald-700">
                  {selectedRepo.openIssuesCount.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 uppercase">
                  Open Issues
                </div>
              </div>
              <a
                href={selectedRepo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>View Repo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {isLoadingIssues ? (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <div className="font-display text-base font-bold text-[#0A0A0A]">
              Fetching open issues from {selectedRepo.fullName}...
            </div>
            <p className="text-xs text-slate-600">
              Ranking issues against your {(profile?.skills?.languages ?? ['TypeScript']).join(', ')} profile...
            </p>
          </div>
        ) : repoIssues.length === 0 ? (
          <div className="py-16 text-center space-y-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="font-display text-lg font-bold text-[#0A0A0A]">
              No open issues returned by GitHub API for this repository
            </h3>
            <p className="text-sm text-slate-700 max-w-md mx-auto">
              You can inspect the repository issue tracker directly on GitHub or select another project from {selectedOrg.name}.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setSelectedRepo(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold cursor-pointer"
              >
                Choose Another Project
              </button>
              <a
                href={`${selectedRepo.htmlUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>Open GitHub Issues Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-slate-700 px-1">
              Found <strong className="text-[#0A0A0A] font-mono font-bold tabular-nums">{repoIssues.length}</strong> open
              issues in <span className="font-mono font-semibold text-blue-700">{selectedRepo.fullName}</span>. Click any issue to launch the AI Onboarding Guide:
            </div>

            {repoIssues.map((issue) => {
              const score = issue.matchScore || 75;
              const isSaved = savedIssueIds?.has(issue.id) || false;
              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue && onSelectIssue(issue)}
                  className="group p-6 rounded-2xl bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono tabular-nums">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {score}% Skill Fit
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-600">
                        #{issue.number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {issue.estimatedEffort}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 font-mono tabular-nums">
                        <MessageSquare className="w-3 h-3 text-slate-500" />
                        {issue.commentsCount} comments
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#0A0A0A] group-hover:text-blue-700 transition-colors flex items-center gap-2">
                      <span>{issue.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity shrink-0" />
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {issue.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {issue.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300"
                        >
                          #{label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-64 shrink-0 flex items-center lg:flex-col justify-end gap-2">
                    {onToggleSaveIssue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveIssue(issue);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-display font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'fill-amber-600 text-amber-600' : ''
                          }`}
                        />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectIssue) onSelectIssue(issue);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-display font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Open AI Setup Guide</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER STEP 2: REPOSITORIES INSIDE SELECTED ORGANIZATION
  // ============================================================================
  if (selectedOrg) {
    const isActive2025 = selectedOrg.yearsParticipated.includes(2025);
    const latestYear = Math.max(...selectedOrg.yearsParticipated);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Top Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              onClick={() => setSelectedOrg(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
            >
              505 GSoC Orgs
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-[#0A0A0A] font-bold">{selectedOrg.name}</span>
          </div>

          <button
            onClick={() => setSelectedOrg(null)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Organizations</span>
          </button>
        </div>

        {/* Organization Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Step 2 of 3: Choose a Project Repository
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                  {selectedOrg.category}
                </span>
                {isActive2025 ? (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Active 2025 Cohort
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <History className="w-3 h-3 text-amber-600" />
                    Historical Cohort (Last Active: {latestYear})
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                {selectedOrg.name} — Active Repositories
              </h1>
              <p className="text-slate-700 text-sm max-w-3xl">
                {selectedOrg.description} Select any project below to inspect its open beginner issues and launch the AI Onboarding Guide.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href={selectedOrg.ideasListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Official GSoC Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={selectedOrg.issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-600 mr-1">GSoC History:</span>
            {selectedOrg.yearsParticipated.map((y) => (
              <span
                key={y}
                className={`px-2 py-0.5 rounded text-xs font-mono ${
                  y === 2025
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                    : 'bg-slate-100 text-slate-700 border border-slate-300 font-medium'
                }`}
              >
                {y}
              </span>
            ))}
          </div>
        </div>

        {/* Repositories Grid */}
        {isLoadingRepos ? (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <div className="font-display text-base font-bold text-[#0A0A0A]">
              Loading repositories for {selectedOrg.name}...
            </div>
            <p className="text-xs text-slate-600">
              Querying GitHub for active non-fork projects with open issues...
            </p>
          </div>
        ) : orgRepos.length === 0 ? (
          <div className="py-16 text-center space-y-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="font-display text-lg font-bold text-[#0A0A0A]">
              Could not auto-fetch repositories for &ldquo;{selectedOrg.name}&rdquo;
            </h3>
            <p className="text-sm text-slate-700 max-w-md mx-auto">
              You can open their GitHub search directly or browse another organization.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs font-display font-semibold cursor-pointer"
              >
                Back to Organizations
              </button>
              <a
                href={selectedOrg.issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>Search {selectedOrg.name} on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgRepos.map((repo) => {
              const isVerifiedCount = repo.beginnerCountVerified !== false;
              const beginnerCount = repo.beginnerIssueCount ?? 0;
              const isZeroBeginnerVerified = isVerifiedCount && beginnerCount === 0;

              return (
                <div
                  key={repo.id}
                  onClick={() => {
                    if (!isZeroBeginnerVerified) {
                      handleSelectRepo(repo);
                    }
                  }}
                  aria-disabled={isZeroBeginnerVerified}
                  className={`group p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                    isZeroBeginnerVerified
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50/40 border-slate-200 hover:border-blue-400 cursor-pointer shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FolderGit2
                          className={`w-5 h-5 shrink-0 ${
                            isZeroBeginnerVerified
                              ? 'text-slate-400'
                              : 'text-blue-600'
                          }`}
                        />
                        <h3
                          className={`font-display text-lg font-bold transition-colors break-all ${
                            isZeroBeginnerVerified
                              ? 'text-slate-500'
                              : 'text-[#0A0A0A] group-hover:text-blue-700'
                          }`}
                        >
                          {repo.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                        {repo.language}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {repo.description}
                    </p>

                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-mono tabular-nums">
                      <span className="flex items-center gap-1 font-semibold">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <GitFork className="w-3.5 h-3.5 text-slate-500" />
                        {repo.forks.toLocaleString()}
                      </span>
                      {isVerifiedCount ? (
                        <span
                          className={`font-bold ${
                            isZeroBeginnerVerified
                              ? 'text-slate-500'
                              : 'text-emerald-700'
                          }`}
                        >
                          {beginnerCount} Beginner Issues
                        </span>
                      ) : (
                        <span className="font-bold text-blue-700">
                          {repo.openIssuesCount.toLocaleString()} Open Issues
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isZeroBeginnerVerified}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isZeroBeginnerVerified) {
                          handleSelectRepo(repo);
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl border font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isZeroBeginnerVerified
                          ? 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-2xs cursor-pointer'
                      }`}
                    >
                      {isZeroBeginnerVerified ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>No Open Beginner Issues</span>
                        </>
                      ) : isVerifiedCount ? (
                        <>
                          <span>Explore {beginnerCount} Beginner Issues</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Inspect Open Issues ({repo.openIssuesCount})</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER STEP 1: ALL 505 MENTORSHIP ORGANIZATIONS DIRECTORY
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold uppercase tracking-wide">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Complete 10-Year GSoC Archive (2016–2025) • {MENTORSHIP_ORGANIZATIONS.length} Verified Organizations
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
            Prepare for{' '}
            <span className="text-blue-600">
              Google Summer of Code &amp; LFX
            </span>
          </h1>

          <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
            Explore <strong className="text-[#0A0A0A]">{MENTORSHIP_ORGANIZATIONS.length} official Google Summer of Code organizations</strong> across the last 10 years. Click any organization to drill down into its active repositories, inspect open beginner issues, and generate a tailored AI Setup Guide.
          </p>
        </div>
      </div>

      {/* Section 1: Program Timeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0A0A0A] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Global Open-Source Mentorship Programs
          </h2>
          <span className="text-xs font-medium text-slate-600">
            Click a program card to filter organizations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MENTORSHIP_PROGRAMS.map((prog) => {
            const isSelected = selectedProgram === prog.shortName;
            return (
              <div
                key={prog.id}
                onClick={() => {
                  setSelectedProgram(isSelected ? 'All' : prog.shortName);
                  setCurrentPage(1);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {prog.shortName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {prog.status}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#0A0A0A]">
                    {prog.name}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-[#0A0A0A]">Stipend:</strong> {prog.stipendRange}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong className="text-[#0A0A0A]">Window:</strong> {prog.applicationWindow}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{prog.eligibility}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Multi-Year & Category Filter Controls */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0A0A0A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Step 1: Select a Mentorship Organization ({scoredOrgs.length} of{' '}
              {MENTORSHIP_ORGANIZATIONS.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any organization card below to inspect its repositories and open beginner issues
            </p>
          </div>
          {(selectedYears.length > 0 ||
            selectedCategory !== 'All' ||
            selectedProgram !== 'All' ||
            onlyMatchedToMe ||
            searchInput) && (
            <button
              onClick={resetAllFilters}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-bold self-start sm:self-auto transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Filter Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          {/* Row 1: Search + Category + Matched Toggle */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search 505 organizations by name, tech stack (Python, C++, Rust, React), or domain..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Select */}
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-600">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by GSoC category"
                  className="bg-transparent text-xs sm:text-sm text-[#0A0A0A] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-white text-[#0A0A0A]">
                    All Categories
                  </option>
                  {GSOC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-[#0A0A0A]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Select */}
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-600">Program:</span>
                <select
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by mentorship program"
                  className="bg-transparent text-xs sm:text-sm text-[#0A0A0A] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-white text-[#0A0A0A]">
                    All Programs
                  </option>
                  <option value="GSoC" className="bg-white text-[#0A0A0A]">
                    GSoC
                  </option>
                  <option value="LFX" className="bg-white text-[#0A0A0A]">
                    LFX Mentorship
                  </option>
                  <option value="ESoC" className="bg-white text-[#0A0A0A]">
                    ESoC
                  </option>
                </select>
              </div>

              {/* Match to My Stack Button */}
              <button
                onClick={() => {
                  setOnlyMatchedToMe(!onlyMatchedToMe);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyMatchedToMe
                    ? 'bg-blue-600 border-blue-700 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0A0A0A]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${onlyMatchedToMe ? 'text-white' : 'text-blue-600'}`} />
                <span>Matches My Stack</span>
              </button>
            </div>
          </div>

          {/* Row 2: 10-Year GSoC Participation Filter Pills (2016 - 2025) */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-display font-bold text-slate-700 mr-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Filter by GSoC Cohort Year (2016–2025):
            </span>
            {GSOC_AVAILABLE_YEARS.map((year) => {
              const isSelected = selectedYears.includes(year);
              return (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 hover:text-[#0A0A0A]'
                  }`}
                >
                  {year}
                </button>
              );
            })}
            {selectedYears.length > 0 && (
              <button
                onClick={() => {
                  setSelectedYears([]);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-semibold ml-1 transition-colors cursor-pointer"
              >
                Clear years
              </button>
            )}
          </div>
        </div>

        {/* Organization Cards Grid */}
        {paginatedOrgs.length === 0 ? (
          <div className="text-center py-14 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-slate-700 text-sm mb-4">
              No mentorship organizations match your current filter combination.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-bold transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedOrgs.map((org) => {
                const isActive2025 = org.yearsParticipated.includes(2025);
                const latestYear = Math.max(...org.yearsParticipated);

                return (
                  <div
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className="group p-6 rounded-2xl bg-white hover:bg-slate-50/40 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-5 shadow-2xs hover:shadow-md cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {org.programs.map((p) => (
                            <span
                              key={p}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300"
                            >
                              {p}
                            </span>
                          ))}
                          {isActive2025 ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              2025 Cohort
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                              <History className="w-3 h-3 text-amber-600" />
                              Historical (Last: {latestYear})
                            </span>
                          )}
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-blue-600" />
                            {org.category}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1 font-mono tabular-nums ${
                            org.matchedTech.length > 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {org.matchPercentage}% Stack Fit
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-display text-xl font-bold text-[#0A0A0A] group-hover:text-blue-700 transition-colors flex items-center justify-between">
                        <span>{org.name}</span>
                        <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity shrink-0" />
                      </h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {org.description}
                      </p>

                      {/* Years Participated */}
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 mr-1">
                          GSoC Years ({org.yearsParticipated.length}):
                        </span>
                        {org.yearsParticipated.map((y) => (
                          <span
                            key={y}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              selectedYears.includes(y)
                                ? 'bg-amber-100 text-amber-950 border border-amber-400 font-bold'
                                : y === 2025
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {y}
                          </span>
                        ))}
                      </div>

                      {/* Tech Stack Pills */}
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-slate-600 mr-1" />
                        {org.techStack.map((tech) => {
                          const isMatched = org.matchedTech.includes(tech);
                          return (
                            <span
                              key={tech}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                isMatched
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {isMatched && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              )}
                              {tech}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOrg(org);
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-display font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Explore Projects &amp; Beginner Issues</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={org.ideasListUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>GSoC Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <div className="text-xs text-slate-700 font-mono tabular-nums">
                  Showing{' '}
                  <strong className="text-[#0A0A0A]">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-[#0A0A0A]">
                    {Math.min(currentPage * ITEMS_PER_PAGE, scoredOrgs.length)}
                  </strong>{' '}
                  of <strong className="text-[#0A0A0A]">{scoredOrgs.length}</strong>{' '}
                  organizations
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-800 tabular-nums">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] border border-slate-300 text-xs font-display font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

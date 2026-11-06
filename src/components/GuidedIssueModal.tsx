import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Sparkles,
  ShieldAlert,
  GitPullRequest,
  Clock,
  Star,
  GitFork,
  Scale,
  FileText,
  Loader2,
  Bot,
  Cpu,
  ListChecks,
  FolderTree,
  Bookmark,
  Wrench,
  FlaskConical,
  Compass
} from 'lucide-react';
import {
  GitHubIssue,
  StudentProfile,
  LiveRepoContext,
  AISetupAnalysis
} from '../types';
import { fetchWithCsrf } from '../utils/csrfClient';

interface GuidedIssueModalProps {
  issue: GitHubIssue;
  profile: StudentProfile;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onClose: () => void;
  completedSteps: boolean[];
  onToggleStep: (stepIndex: number) => void;
}

const DEFAULT_CHECKLIST_STEPS = [
  {
    title: 'Read the Issue Description & Maintainer Discussion',
    description:
      'Review the full thread on GitHub to confirm nobody else has already submitted an open Pull Request for this issue.'
  },
  {
    title: 'Fork & Clone the Repository Locally',
    description:
      'Click "Fork" on the GitHub repository page, then run the setup commands above to clone your fork and install dependencies.'
  },
  {
    title: 'Create a Dedicated Feature Branch',
    description:
      'Never commit directly to main. Create a descriptive branch name (e.g., git checkout -b fix/issue-number).'
  },
  {
    title: 'Implement the Fix & Verify Tests Pass',
    description:
      'Make a focused change that addresses the issue requirements and run the project test suite locally.'
  },
  {
    title: 'Push Your Branch & Open a Pull Request',
    description:
      'Push your branch to your fork and open a Pull Request referencing the issue number (e.g., "Fixes #123").'
  }
];

export const GuidedIssueModal: React.FC<GuidedIssueModalProps> = ({
  issue,
  profile,
  isSaved = false,
  onToggleSave,
  onClose,
  completedSteps,
  onToggleStep
}) => {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [liveContext, setLiveContext] = useState<LiveRepoContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(false);

  // AI Setup Analyzer State
  const [aiAnalysis, setAiAnalysis] = useState<AISetupAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isAIFallback, setIsAIFallback] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    const parts = issue.repoName.split('/');
    if (parts.length !== 2) return;
    const [owner, repo] = parts;

    // 1. Fetch Live Repo Context
    setIsLoadingContext(true);
    fetch(
      `/api/github/repo-context?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
      { credentials: 'include' }
    )
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.context) {
          setLiveContext(data.context);
        }
      })
      .catch(() => {
        // Fallback quietly
      })
      .finally(() => {
        if (isMounted) setIsLoadingContext(false);
      });

    // 2. Fetch Grounded AI Setup & Contribution Analysis
    setIsLoadingAI(true);
    fetchWithCsrf('/api/ai/analyze-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner,
        repo,
        issueTitle: issue.title,
        issueSummary: issue.summary,
        issueNumber: issue.number
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.analysis) {
          setAiAnalysis(data.analysis);
          setIsAIFallback(Boolean(data.isFallback));
        }
      })
      .catch(() => {
        // Fallback quietly to issue.setupSteps
      })
      .finally(() => {
        if (isMounted) setIsLoadingAI(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issue.repoName, issue.title, issue.summary, issue.number]);

  const activeSetupCommands =
    aiAnalysis?.setup_commands && aiAnalysis.setup_commands.length > 0
      ? aiAnalysis.setup_commands
      : issue.setupSteps;

  const handleCopyCommands = () => {
    const text = activeSetupCommands.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = Math.round(
    (completedCount / DEFAULT_CHECKLIST_STEPS.length) * 100
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-issue-modal-title"
    >
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/80">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1 font-mono tabular-nums">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {issue.matchScore || 85}% Heuristic Skill Fit
              </span>
              <span className="text-xs font-mono font-semibold text-[#0A0A0A] bg-white px-2.5 py-1 rounded-md border border-slate-300">
                {issue.repoName} #{issue.number}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Est. {issue.estimatedEffort}
              </span>
            </div>
            <h2
              id="guided-issue-modal-title"
              className="font-display text-xl sm:text-2xl font-extrabold text-[#0A0A0A] leading-snug"
            >
              {issue.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onToggleSave && (
              <button
                type="button"
                onClick={onToggleSave}
                title={isSaved ? 'Remove from Saved Issues' : 'Save Issue for Later'}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                    : 'bg-white border-slate-300 text-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isSaved ? 'fill-amber-600 text-amber-600' : 'text-slate-600'
                  }`}
                />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              title="Close modal"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 bg-white">
          {/* Section 1: Issue Overview & Skill Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Issue Overview &amp; Context
              </h3>
              <p className="text-[#111111] text-sm leading-relaxed">
                {aiAnalysis?.issueOverview || issue.summary}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                {issue.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-white text-slate-700 border border-slate-300"
                  >
                    #{label}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-blue-800">
                Your Skill Fit Breakdown
              </h3>
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-700">Matched from your profile:</div>
                <div className="flex flex-wrap gap-1.5">
                  {issue.matchBreakdown?.matchedSkills.length ? (
                    issue.matchBreakdown.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-700 font-medium">
                      General {issue.language} foundations
                    </span>
                  )}
                </div>

                {issue.matchBreakdown?.missingSkills &&
                  issue.matchBreakdown.missingSkills.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-slate-700 pt-2">
                        Skills you&apos;ll practice / learn:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {issue.matchBreakdown.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* Section 1.5: Live Repository Context & Root Directory Tree */}
          {(isLoadingContext || liveContext) && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Verified Repository Context ({issue.repoName})
                </h3>
                {isLoadingContext && (
                  <span className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Fetching repository metadata &amp; root tree...
                  </span>
                )}
              </div>

              {liveContext && (
                <>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {liveContext.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#0A0A0A] font-mono tabular-nums">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1.5 font-semibold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {liveContext.stars.toLocaleString()} stars
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1.5 font-semibold">
                      <GitFork className="w-3.5 h-3.5 text-blue-600" />
                      {liveContext.forks.toLocaleString()} forks
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 flex items-center gap-1.5 font-semibold">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      License: {liveContext.license}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300">
                      Default branch: <strong>{liveContext.defaultBranch}</strong>
                    </span>
                  </div>

                  {liveContext.rootFiles && liveContext.rootFiles.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                        Verified Top-Level Repository Structure
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {liveContext.rootFiles.slice(0, 20).map((entry) => (
                          <span
                            key={entry}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                              entry.endsWith('/')
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-[#0A0A0A] border-slate-300'
                            }`}
                          >
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Section 2: Grounded AI Onboarding & Architecture Guide */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base font-extrabold text-[#0A0A0A] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Repository Onboarding &amp; Implementation Guide
                </h3>
                {isLoadingAI ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    Analyzing README, CONTRIBUTING &amp; Manifest...
                  </span>
                ) : aiAnalysis ? (
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${
                      !isAIFallback
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {!isAIFallback ? 'Gemini 3.8 Flash Synthesis' : 'Grounded Heuristic Synthesis'}
                  </span>
                ) : null}
              </div>

              <button
                onClick={handleCopyCommands}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-display font-semibold text-[#0A0A0A] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied Setup Commands!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Copy Setup Commands</span>
                  </>
                )}
              </button>
            </div>

            {aiAnalysis && (
              <div className="space-y-4">
                {/* Context Verification Notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                  <span className="font-medium">{aiAnalysis.contextNotice}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {aiAnalysis.verifiedContextFiles.map((file) => (
                      <span
                        key={file}
                        className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-[11px] font-mono font-semibold text-emerald-800"
                      >
                        ✓ {file}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Row 1: What to Understand First + Relevant Files & Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      What to Understand First
                    </div>
                    <ul className="space-y-2">
                      {aiAnalysis.whatToUnderstandFirst.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-blue-600 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                      Relevant Files, Folders &amp; Architecture
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {aiAnalysis.architectureNotes}
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {aiAnalysis.relevantFilesAndFolders.map((fileNote, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-[#0A0A0A] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-300"
                        >
                          {fileNote}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Row 2: Prerequisites + Contribution Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      Required Environment &amp; Prerequisites
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiAnalysis.prerequisites.map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#0A0A0A] border border-slate-300"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                      Maintainer Contribution Rules
                    </div>
                    <ul className="space-y-1.5">
                      {aiAnalysis.contribution_rules.map((rule, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 flex items-start gap-2"
                        >
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Row 3: Reproduction Workflow + Implementation Approach + Testing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-600" />
                      1. Local Reproduction
                    </div>
                    <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700 leading-relaxed">
                      {aiAnalysis.reproductionWorkflow.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      2. Implementation Plan
                    </div>
                    <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700 leading-relaxed">
                      {aiAnalysis.implementationApproach.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-display font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                      3. Verification &amp; Tests
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {aiAnalysis.testingInstructions.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Commands Box */}
            <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 space-y-2 overflow-x-auto shadow-inner">
              {activeSetupCommands.map((cmd, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-slate-400 select-none">$</span>
                  <span className="text-emerald-400">{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Interactive 5-Step Contribution Checklist */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-extrabold text-[#0A0A0A] flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-emerald-600" />
                  Interactive First-PR Contribution Checklist
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Track your progress step-by-step for {profile.name}. Saved automatically in your browser.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                  {completedCount}/{DEFAULT_CHECKLIST_STEPS.length} Done
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_CHECKLIST_STEPS.map((step, index) => {
                const isDone = completedSteps[index] || false;
                return (
                  <div
                    key={index}
                    onClick={() => onToggleStep(index)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-700'
                        : 'bg-white border-slate-200 hover:border-blue-400 text-[#0A0A0A]'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-emerald-600 shrink-0 focus:outline-none"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div
                        className={`font-display text-sm font-bold ${
                          isDone ? 'line-through text-slate-500' : 'text-[#0A0A0A]'
                        }`}
                      >
                        Step {index + 1}: {step.title}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintainer Etiquette Tip */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed">
              <strong className="text-amber-900 font-bold">Open-Source Etiquette Tip:</strong>{' '}
              Before asking &ldquo;Can I work on this?&rdquo;, read the repository&apos;s{' '}
              <code className="px-1.5 py-0.5 rounded bg-white border border-amber-300 text-[#0A0A0A] font-mono">
                CONTRIBUTING.md
              </code>
              . Many projects encourage you to reproduce the issue locally first and open a draft Pull Request directly!
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href={issue.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
          >
            <span>Explore Repository ({issue.repoName})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 text-xs sm:text-sm font-display font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <a
              href={issue.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Open Issue #{issue.number} on GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ArrowRight,
  Sparkles,
  GitPullRequest,
  ShieldCheck,
  Terminal,
  Cpu,
  CheckCircle2,
  Compass,
  Award,
  BookOpen,
  FolderTree
} from 'lucide-react';

interface HeroLandingProps {
  onStartOnboarding: () => void;
  onExploreDashboard: () => void;
  onExploreMentorship: () => void;
  hasCompletedOnboarding: boolean;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onStartOnboarding,
  onExploreDashboard,
  onExploreMentorship,
  hasCompletedOnboarding
}) => {
  return (
    <div className="relative overflow-hidden bg-[#FAFAFA]">
      {/* Subtle Top Architectural Accent */}
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative z-10">
        {/* Top Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-semibold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Open-Source Contribution Discovery, Onboarding &amp; Mentorship Platform</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0A0A0A] leading-[1.12]">
            Bridge University Coursework to{' '}
            <span className="text-blue-600">
              Your First Merged Pull Request
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Students often know Python, TypeScript, or React from class—but stall when facing 50,000-line repositories. DevSync ranks live beginner issues against your skills, explores <strong className="text-[#0A0A0A] font-semibold">505 GSoC organizations</strong>, and generates grounded local setup guides.
          </p>

          {/* CTA Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onStartOnboarding}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm sm:text-base shadow-sm border border-blue-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {hasCompletedOnboarding
                  ? 'Update My Skill Profile'
                  : 'Match My Coursework Skills'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreDashboard}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 font-display font-semibold text-sm sm:text-base shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Explore Ranked Issue Feed</span>
            </button>

            <button
              onClick={onExploreMentorship}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-display font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>505 GSoC Orgs (2016–2025)</span>
            </button>
          </div>
        </div>

        {/* Problem vs Solution Comparison */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Without DevSync */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-red-200 shadow-xs">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 mb-2">
              The First-Contribution Bottleneck
            </div>
            <h2 className="font-display text-xl font-bold text-[#0A0A0A] mb-4">
              Why Students Abandon Their First Open-Source Attempt
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-50 border border-red-300 text-red-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✕
                </span>
                <span>
                  <strong className="text-[#0A0A0A]">Noisy Issue Trackers:</strong>{' '}
                  Searching raw GitHub issues returns thousands of stale, already-claimed, or mislabeled tasks.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-50 border border-red-300 text-red-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✕
                </span>
                <span>
                  <strong className="text-[#0A0A0A]">Unfamiliar Monorepo Layouts:</strong>{' '}
                  Students spend hours figuring out which package manager, test runner, or folder contains the target code.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-50 border border-red-300 text-red-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✕
                </span>
                <span>
                  <strong className="text-[#0A0A0A]">GSoC Research Friction:</strong>{' '}
                  Finding which organizations actively mentor in your language across 10 years of cohorts requires manual spreadsheet digging.
                </span>
              </li>
            </ul>
          </div>

          {/* With DevSync */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-300 shadow-xs">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 mb-2">
              The DevSync Workflow
            </div>
            <h2 className="font-display text-xl font-bold text-[#0A0A0A] mb-4">
              Grounded Engineering Onboarding — 100% Free for Students
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0A0A0A]">Heuristic Skill-Fit Scoring:</strong>{' '}
                  Ranks unassigned issues by primary language, framework overlap, issue clarity, and discussion contention.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0A0A0A]">Grounded Repository Context:</strong>{' '}
                  Reads live <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[#0A0A0A] font-mono text-xs">README.md</code>, <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[#0A0A0A] font-mono text-xs">CONTRIBUTING.md</code>, project manifests, and top-level directory trees before synthesizing setup steps.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0A0A0A]">Verified GitHub Profile Telemetry:</strong>{' '}
                  Computes real per-language byte distributions and merged PR history for any public GitHub username.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3.5">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-display text-base font-bold text-[#0A0A0A] mb-1.5">
              1. Skill &amp; Handle Analysis
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Select your coursework stack or scan any public GitHub username to compute verified language byte ratios.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3.5">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-display text-base font-bold text-[#0A0A0A] mb-1.5">
              2. 505 GSoC Org Explorer
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Filter 10 years of GSoC cohorts (2016–2025) with O(1) bitmask filtering and drill into active repositories.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3.5">
              <FolderTree className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-display text-base font-bold text-[#0A0A0A] mb-1.5">
              3. Grounded Setup Guide
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Inspect verified repository root files, prerequisites, reproduction steps, and copyable terminal commands.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3.5">
              <GitPullRequest className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-display text-base font-bold text-[#0A0A0A] mb-1.5">
              4. Interactive PR Checklist
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Bookmark target issues, track your 5-step contribution checklist, and practice Git commands in the simulator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

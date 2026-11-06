import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  GitFork,
  GitBranch,
  GitPullRequest,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Award,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Layers,
  ListChecks,
  Menu,
  X,
  XCircle,
  Compass
} from 'lucide-react';
import { StudentProfile } from '../types';
import {
  ALL_GIT_LESSONS,
  DiagramType,
  FINAL_ASSESSMENT_QUESTIONS,
  GIT_CURRICULUM_LEVELS
} from '../data/gitCurriculum';
import {
  GitAssessmentRecord,
  PASSING_SCORE_PERCENTAGE,
  calculateOverallCourseProgress,
  generateCertificateId,
  gradeFinalAssessment,
  isCertificateUnlocked,
  loadAssessmentFromStorage,
  loadCompletedLessonsFromStorage,
  saveAssessmentToStorage,
  saveCompletedLessonsToStorage,
  validateLessonQuizAnswer
} from '../utils/gitCourseEngine';
import { GitCertificate } from './GitCertificate';
import { DEFAULT_STUDENT_PROFILE } from '../constants/skills';

interface LearnGitModuleProps {
  profile?: StudentProfile;
  onBackToDashboard: () => void;
  onExploreMentorship?: () => void;
  onOpenPortfolio?: () => void;
}

type ActiveTab = 'curriculum' | 'assessment' | 'certificate';

const ConceptDiagram: React.FC<{ type: DiagramType }> = ({ type }) => {
  if (type === 'three-states') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Visual Architecture: Git’s Three States</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="p-4 rounded-xl bg-white border-2 border-amber-300 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              1. Working Directory
            </span>
            <h4 className="font-display font-bold text-sm text-[#0A0A0A]">
              Modified / Untracked Files
            </h4>
            <p className="text-xs text-slate-700">
              Your local workspace files edited in VS Code before staging.
            </p>
            <div className="pt-2 text-[11px] font-mono font-bold text-blue-700 flex items-center gap-1">
              <span>git add &lt;file&gt;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border-2 border-blue-400 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              2. Staging Area (Index)
            </span>
            <h4 className="font-display font-bold text-sm text-[#0A0A0A]">
              Staged Snapshot (.git/index)
            </h4>
            <p className="text-xs text-slate-700">
              Exact changes queued and verified for the next atomic commit.
            </p>
            <div className="pt-2 text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-1">
              <span>git commit -m &quot;...&quot;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border-2 border-emerald-400 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              3. Repository (.git)
            </span>
            <h4 className="font-display font-bold text-sm text-[#0A0A0A]">
              Committed History Graph
            </h4>
            <p className="text-xs text-slate-700">
              Permanent cryptographic SHA commit snapshots stored in .git/objects.
            </p>
            <div className="pt-2 text-[11px] font-mono font-bold text-slate-700">
              ✓ Immutable SHA-1 / SHA-256
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'branching') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-blue-600" />
          <span>Visual Commit Graph: Branch Pointers &amp; HEAD</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 font-mono text-xs overflow-x-auto space-y-2">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-300 font-bold">
              c1a09f2
            </span>
            <span>──▶</span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-300 font-bold">
              4b825dc
            </span>
            <span>──▶</span>
            <span className="px-2 py-1 rounded bg-blue-50 border border-blue-300 text-blue-900 font-bold">
              92e1a4c (main)
            </span>
          </div>
          <div className="pl-28 flex items-center gap-2 text-emerald-800">
            <span>╰──▶</span>
            <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-300 font-bold">
              e41d90a (fix/issue-104) ◀── HEAD
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'fork-workflow') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <GitFork className="w-4 h-4 text-blue-600" />
          <span>Open-Source Triangle Workflow (Upstream ↔ Origin ↔ Local)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
            <span className="font-mono font-bold text-amber-800 uppercase">
              1. Upstream (GitHub)
            </span>
            <div className="font-display font-bold text-[#0A0A0A]">
              official-org/project
            </div>
            <p className="text-slate-700">
              Pull latest community updates via{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">
                git fetch upstream
              </code>
              , and target your Pull Request here.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-blue-300 space-y-1">
            <span className="font-mono font-bold text-blue-700 uppercase">
              2. Origin (Your GitHub Fork)
            </span>
            <div className="font-display font-bold text-[#0A0A0A]">
              your-username/project
            </div>
            <p className="text-slate-700">
              Your personal cloud copy. Push your feature branches here via{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">
                git push origin &lt;branch&gt;
              </code>
              .
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-emerald-300 space-y-1">
            <span className="font-mono font-bold text-emerald-700 uppercase">
              3. Local Clone (Laptop)
            </span>
            <div className="font-display font-bold text-[#0A0A0A]">
              ~/code/project
            </div>
            <p className="text-slate-700">
              Where you create branches, write code, run tests, and commit changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'git-workflows') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
          Branching Strategy Comparison
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
            <div className="font-display font-bold text-[#0A0A0A]">
              Feature Branch (GitHub Flow)
            </div>
            <p className="text-slate-700">
              Single <code className="font-mono">main</code> branch + short-lived{' '}
              <code className="font-mono">feat/*</code> or{' '}
              <code className="font-mono">fix/*</code> PR branches. Best for open source.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
            <div className="font-display font-bold text-[#0A0A0A]">Gitflow</div>
            <p className="text-slate-700">
              Separate <code className="font-mono">main</code>,{' '}
              <code className="font-mono">develop</code>,{' '}
              <code className="font-mono">release/*</code>, and{' '}
              <code className="font-mono">hotfix/*</code> branches for versioned releases.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
            <div className="font-display font-bold text-[#0A0A0A]">
              Trunk-Based Development
            </div>
            <p className="text-slate-700">
              Frequent small daily merges directly into{' '}
              <code className="font-mono">main</code> guarded by runtime feature flags.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
        <GitPullRequest className="w-4 h-4 text-emerald-600" />
        <span>End-to-End Open-Source Contribution Pipeline</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold">
        {[
          '1. Find Issue',
          '2. Fork & Clone',
          '3. Sync & Branch',
          '4. Code & Test',
          '5. Stage & Commit',
          '6. Push to Origin',
          '7. Open PR (Closes #ID)'
        ].map((step, idx) => (
          <React.Fragment key={step}>
            <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#0A0A0A]">
              {step}
            </span>
            {idx < 6 && <span className="text-slate-400">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const LearnGitModule: React.FC<LearnGitModuleProps> = ({
  profile = DEFAULT_STUDENT_PROFILE,
  onBackToDashboard,
  onExploreMentorship,
  onOpenPortfolio
}) => {
  // Persisted course completion state
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() =>
    loadCompletedLessonsFromStorage()
  );
  const [assessmentRecord, setAssessmentRecord] =
    useState<GitAssessmentRecord | null>(() => loadAssessmentFromStorage());

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('curriculum');
  const [activeLessonId, setActiveLessonId] = useState<string>('lesson-1');
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    'level-1': true,
    'level-2': true,
    'level-3': true,
    'level-4': true,
    'level-5': true
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState<boolean>(false);

  // Per-lesson interactive state
  const activeLesson = useMemo(
    () =>
      ALL_GIT_LESSONS.find((l) => l.id === activeLessonId) || ALL_GIT_LESSONS[0],
    [activeLessonId]
  );
  const activeLessonIndex = useMemo(
    () => ALL_GIT_LESSONS.findIndex((l) => l.id === activeLesson.id),
    [activeLesson]
  );

  const [terminalInput, setTerminalInput] = useState<string>(
    activeLesson.sandboxCommand
  );
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [copiedCommandIdx, setCopiedCommandIdx] = useState<number | null>(null);

  // Per-lesson Quiz state
  const [quizAnswer, setQuizAnswer] = useState<string | number>('');
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Final Assessment state
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    Record<string, string | number>
  >({});
  const [assessmentSubmission, setAssessmentSubmission] = useState<ReturnType<
    typeof gradeFinalAssessment
  > | null>(null);

  // Sync completedLessonIds to localStorage
  useEffect(() => {
    saveCompletedLessonsToStorage(completedLessonIds);
  }, [completedLessonIds]);

  // Reset sandbox and lesson quiz inputs when switching active lesson
  useEffect(() => {
    setTerminalInput(activeLesson.sandboxCommand);
    setTerminalOutput(null);
    setQuizAnswer('');
    setQuizFeedback(null);
  }, [activeLesson]);

  const completedSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds]
  );

  const courseProgress = useMemo(
    () => calculateOverallCourseProgress(completedSet),
    [completedSet]
  );

  const certificateUnlocked = useMemo(
    () => isCertificateUnlocked(completedSet, assessmentRecord),
    [completedSet, assessmentRecord]
  );

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveTab('curriculum');
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLevelAccordion = (levelId: string) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [levelId]: !prev[levelId]
    }));
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    setCompletedLessonIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const handleRunSandboxCommand = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminalOutput(activeLesson.expectedOutput);
  };

  const handleCopyCommand = (cmd: string, idx: number) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd).catch(() => {});
    }
    setCopiedCommandIdx(idx);
    setTimeout(() => setCopiedCommandIdx(null), 1800);
  };

  const handleVerifyLessonQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateLessonQuizAnswer(activeLesson, quizAnswer);
    setQuizFeedback({
      correct: result.correct,
      message: result.feedback
    });
    if (result.correct) {
      handleMarkLessonComplete(activeLesson.id);
    }
  };

  const handleCompleteCurrentLevel = (levelId: string) => {
    const level = GIT_CURRICULUM_LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    const idsToAdd = level.lessons.map((l) => l.id);
    setCompletedLessonIds((prev) =>
      Array.from(new Set([...prev, ...idsToAdd]))
    );
  };

  const handleResetCourseProgress = () => {
    setCompletedLessonIds([]);
    setQuizFeedback(null);
  };

  const handleSubmitFinalAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const grade = gradeFinalAssessment(assessmentAnswers);
    setAssessmentSubmission(grade);

    const nowIso = new Date().toISOString();
    const prevAttempts = assessmentRecord?.attempts || 0;
    const bestScore = Math.max(
      assessmentRecord?.bestScore || 0,
      grade.scorePercentage
    );
    const passed = Boolean(assessmentRecord?.passed || grade.passed);
    const passedAt =
      assessmentRecord?.passedAt || (grade.passed ? nowIso : undefined);
    const certificateId =
      assessmentRecord?.certificateId ||
      (passed
        ? generateCertificateId(
            profile.githubUsername || profile.name || 'student',
            passedAt || nowIso
          )
        : undefined);

    const nextRecord: GitAssessmentRecord = {
      attempts: prevAttempts + 1,
      bestScore,
      lastScore: grade.scorePercentage,
      passed,
      lastAttemptAt: nowIso,
      passedAt,
      certificateId,
      studentName: assessmentRecord?.studentName || profile.name,
      sharedOnPortfolio: assessmentRecord?.sharedOnPortfolio ?? true
    };

    setAssessmentRecord(nextRecord);
    saveAssessmentToStorage(nextRecord);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeFinalAssessment = () => {
    setAssessmentSubmission(null);
    setAssessmentAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCurrentLessonDone = completedSet.has(activeLesson.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Course Header & Overall Progress Dashboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-display font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>
                Complete 5-Level Open-Source Engineering Course • 33 Interactive Modules
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
              Git, GitHub &amp; Open-Source Contribution Curriculum
            </h1>
            <p className="text-slate-700 text-sm max-w-3xl">
              Master everything from Git’s three-state internals and conflict resolution to the Fork &amp; Upstream triangle workflow. Complete all 33 lessons and pass the Final Assessment (≥80%) to earn your verifiable Completion Certificate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Apply Skills to Live Issues</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {completedLessonIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetCourseProgress}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset lesson completion progress"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Overall Course Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold text-[#0A0A0A]">
                Overall Curriculum Progress
              </span>
              <span
                data-testid="overall-progress-badge"
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold tabular-nums border ${
                  courseProgress.allLessonsCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {courseProgress.completedCount} / {courseProgress.totalCount} Lessons ({courseProgress.percentage}%)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
              <span>
                Final Assessment:{' '}
                <strong
                  className={
                    assessmentRecord?.passed
                      ? 'text-emerald-700 font-mono'
                      : 'text-slate-900 font-mono'
                  }
                >
                  {assessmentRecord
                    ? `${assessmentRecord.bestScore}% Best (${
                        assessmentRecord.passed ? 'PASSED' : 'Requires 80%'
                      })`
                    : 'Not Attempted'}
                </strong>
              </span>
              <span>•</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  certificateUnlocked ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {certificateUnlocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certificate Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Certificate Locked</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
            <div
              style={{ width: `${courseProgress.percentage}%` }}
              className={`h-full transition-all duration-300 ${
                courseProgress.allLessonsCompleted
                  ? 'bg-emerald-600'
                  : 'bg-blue-600'
              }`}
            />
          </div>

          {/* 5 Level Mini Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {GIT_CURRICULUM_LEVELS.map((level) => {
              const summary = courseProgress.levelSummaries[level.id];
              const isCompleted = summary.status === 'completed';
              const isInProgress = summary.status === 'in_progress';

              return (
                <div
                  key={level.id}
                  onClick={() => {
                    setExpandedLevels((prev) => ({ ...prev, [level.id]: true }));
                    handleSelectLesson(level.lessons[0].id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isCompleted
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
                      : isInProgress
                      ? 'bg-blue-50/50 border-blue-300 hover:border-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Level {level.number}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border tabular-nums ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {summary.completedCount}/{summary.totalCount}
                    </span>
                  </div>
                  <div className="font-display text-xs font-bold text-[#0A0A0A] truncate">
                    {level.title}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      style={{ width: `${summary.percentage}%` }}
                      className={`h-full ${
                        isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode Switcher Tabs: Curriculum | Final Assessment | Completion Certificate */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('curriculum')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-[#0A0A0A] border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. Interactive Curriculum (33 Lessons)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                activeTab === 'assessment'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : assessmentRecord?.passed
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-[#0A0A0A] border-slate-300'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>2. Final Assessment (18 Questions)</span>
              {assessmentRecord?.passed && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : certificateUnlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {certificateUnlocked ? (
                <Award className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
              <span>3. Completion Certificate</span>
            </button>
          </div>

          {activeTab === 'curriculum' && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isMobileSidebarOpen ? (
                <>
                  <X className="w-4 h-4 text-red-600" />
                  <span>Hide Lesson List</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-blue-600" />
                  <span>Browse All 33 Lessons</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CURRICULUM VIEW (SIDEBAR + ACTIVE LESSON DETAIL)             */}
      {/* =================================================================== */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Multi-Level Curriculum Sidebar */}
          <aside
            className={`lg:col-span-4 space-y-3 ${
              isMobileSidebarOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-extrabold text-[#0A0A0A] uppercase tracking-wider">
                  Course Modules (5 Levels)
                </h2>
                <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
                  {courseProgress.completedCount}/33 Done
                </span>
              </div>

              <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
                {GIT_CURRICULUM_LEVELS.map((level) => {
                  const summary = courseProgress.levelSummaries[level.id];
                  const isExpanded = Boolean(expandedLevels[level.id]);
                  const isLevelDone = summary.status === 'completed';

                  return (
                    <div
                      key={level.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50"
                    >
                      {/* Level Accordion Header */}
                      <button
                        type="button"
                        onClick={() => handleToggleLevelAccordion(level.id)}
                        className="w-full p-3 text-left bg-white hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold uppercase text-blue-700">
                              Level {level.number}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                              {level.badge}
                            </span>
                            {isLevelDone && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="font-display text-xs sm:text-sm font-bold text-[#0A0A0A] truncate mt-0.5">
                            {level.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                            {summary.completedCount}/{summary.totalCount}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </button>

                      {/* Level Lessons List */}
                      {isExpanded && (
                        <div className="p-2 space-y-1 border-t border-slate-200 bg-slate-50/60">
                          {level.lessons.map((lesson) => {
                            const isSelected = lesson.id === activeLesson.id;
                            const isDone = completedSet.has(lesson.id);

                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => handleSelectLesson(lesson.id)}
                                className={`w-full p-2.5 rounded-lg text-left transition-all flex items-start gap-2.5 cursor-pointer border ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-600 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 border-slate-200/80'
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5 border ${
                                    isDone
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : isSelected
                                      ? 'bg-blue-600 text-white border-blue-700'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    lesson.number
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-display text-xs font-bold text-[#0A0A0A] leading-snug">
                                    {lesson.number}. {lesson.title}
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                                    {lesson.duration}
                                  </div>
                                </div>
                              </button>
                            );
                          })}

                          {!isLevelDone && (
                            <div className="pt-1 px-1">
                              <button
                                type="button"
                                onClick={() => handleCompleteCurrentLevel(level.id)}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-display font-semibold transition-colors cursor-pointer"
                              >
                                Mark All Level {level.number} Lessons Complete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Active Lesson Content & Interactive Learning Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
              {/* Lesson Top Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold">
                    Lesson {activeLesson.number} of {ALL_GIT_LESSONS.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-300 text-xs font-mono font-semibold">
                    {
                      GIT_CURRICULUM_LEVELS.find(
                        (l) => l.id === activeLesson.levelId
                      )?.title
                    }
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    • {activeLesson.duration} read &amp; practice
                  </span>
                </div>

                {isCurrentLessonDone ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-display font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lesson Completed</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMarkLessonComplete(activeLesson.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0A0A0A] hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 text-xs font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark Lesson Complete</span>
                  </button>
                )}
              </div>

              {/* Lesson Title & Summary */}
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                  {activeLesson.number}. {activeLesson.title}
                </h2>
                <p className="text-sm sm:text-base font-medium text-blue-800 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
                  {activeLesson.summary}
                </p>
              </div>

              {/* Conceptual Explanation Paragraphs */}
              <div className="space-y-3 text-slate-800 text-sm sm:text-base leading-relaxed">
                {activeLesson.conceptParagraphs.map((paragraph, idx) => (
                  <p key={idx} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Optional SVG/CSS Concept Diagram */}
              {activeLesson.diagramType && (
                <ConceptDiagram type={activeLesson.diagramType} />
              )}

              {/* Key Takeaways Box */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Engineering Takeaways</span>
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-800">
                  {activeLesson.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Copyable Terminal Commands Reference */}
              <div className="space-y-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Copyable Terminal Commands</span>
                </h3>
                <div className="space-y-2.5">
                  {activeLesson.commands.map((cmdItem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <code className="font-mono text-xs sm:text-sm text-emerald-400 font-bold block break-all">
                          $ {cmdItem.command}
                        </code>
                        <p className="text-xs text-slate-300">
                          {cmdItem.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(cmdItem.command, idx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-display font-semibold flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"
                      >
                        {copiedCommandIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Terminal Sandbox & Expected Output Block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-blue-600" />
                    <span>Interactive Terminal Sandbox &amp; Expected Output</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setTerminalInput(activeLesson.sandboxCommand);
                      setTerminalOutput(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-display font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Command</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-[#0A0A0A] border border-slate-800 overflow-hidden shadow-inner">
                  <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono text-slate-300 ml-2 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5" />
                        student@devsync:~/open-source-workspace
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={handleRunSandboxCommand}
                    className="p-4 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-emerald-400 select-none font-bold">
                          $
                        </span>
                        <input
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          aria-label="Simulated Git terminal input"
                          className="flex-1 bg-transparent text-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 self-end sm:self-auto shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Command</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                        {terminalOutput
                          ? 'Live Simulated Output:'
                          : 'Expected Terminal Output:'}
                      </span>
                      <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                        {terminalOutput || activeLesson.expectedOutput}
                      </pre>
                    </div>
                  </form>
                </div>
              </div>

              {/* Common Pitfall Warning Callout Box */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900">
                    Common Pitfall: {activeLesson.commonPitfall.title}
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    {activeLesson.commonPitfall.description}
                  </p>
                </div>
              </div>

              {/* Capstone Lesson 31 Direct Integration with Issue Feed & Mentorship Explorer */}
              {activeLesson.id === 'lesson-31' && (
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold uppercase text-blue-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Live Platform Integration</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800">
                      Ready to test this 7-step workflow on a live repository? Launch the Issue Feed or 505 GSoC Mentorship Explorer.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onBackToDashboard}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Open Issue Feed</span>
                    </button>
                    {onExploreMentorship && (
                      <button
                        type="button"
                        onClick={onExploreMentorship}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>505 GSoC Orgs</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive "Verify Your Understanding" Check */}
              <form
                onSubmit={handleVerifyLessonQuiz}
                className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>
                      Verify Your Understanding • Lesson {activeLesson.number} Check
                    </span>
                  </div>
                  {isCurrentLessonDone && (
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <p className="font-display text-sm sm:text-base font-bold text-[#0A0A0A]">
                  {activeLesson.quiz.question}
                </p>

                {activeLesson.quiz.type === 'multiple-choice' &&
                activeLesson.quiz.options ? (
                  <div className="space-y-2">
                    {activeLesson.quiz.options.map((opt, idx) => {
                      const isChecked = quizAnswer === idx;
                      return (
                        <label
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all text-xs sm:text-sm ${
                            isChecked
                              ? 'bg-blue-50 border-blue-600 text-[#0A0A0A] font-semibold'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${activeLesson.id}`}
                            checked={isChecked}
                            onChange={() => setQuizAnswer(idx)}
                            className="mt-0.5 accent-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-xs sm:text-sm">
                      <span className="text-blue-600 font-bold">$</span>
                      <input
                        type="text"
                        value={String(quizAnswer)}
                        onChange={(e) => setQuizAnswer(e.target.value)}
                        placeholder={
                          activeLesson.quiz.placeholder || 'Type Git command...'
                        }
                        aria-label="Type the correct Git command"
                        className="flex-1 bg-transparent text-[#0A0A0A] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {quizFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                      quizFeedback.correct
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-red-50 border-red-300 text-red-950'
                    }`}
                  >
                    {quizFeedback.correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{quizFeedback.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check Answer &amp; Complete Lesson</span>
                  </button>

                  <span className="text-xs text-slate-600">
                    Hint: {activeLesson.quiz.hint}
                  </span>
                </div>
              </form>

              {/* Bottom Previous / Next Lesson Navigation Bar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                {activeLessonIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectLesson(
                        ALL_GIT_LESSONS[activeLessonIndex - 1].id
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs sm:text-sm font-display font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>
                      Prev: Lesson {ALL_GIT_LESSONS[activeLessonIndex - 1].number}
                    </span>
                  </button>
                ) : (
                  <div />
                )}

                {activeLessonIndex < ALL_GIT_LESSONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectLesson(
                        ALL_GIT_LESSONS[activeLessonIndex + 1].id
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>
                      Next: Lesson {ALL_GIT_LESSONS[activeLessonIndex + 1].number}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('assessment');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Final Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: FINAL ASSESSMENT (18 QUESTIONS ACROSS ALL 5 LEVELS)          */}
      {/* =================================================================== */}
      {activeTab === 'assessment' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
                  <ListChecks className="w-4 h-4 text-blue-600" />
                  <span>
                    Comprehensive Final Assessment • 18 Questions • {PASSING_SCORE_PERCENTAGE}% Passing Score
                  </span>
                </div>
                <h2 className="font-display text-2xl font-extrabold text-[#0A0A0A]">
                  DevSync Git &amp; Open-Source Certification Exam
                </h2>
                <p className="text-xs sm:text-sm text-slate-700">
                  Answer at least 15 out of 18 questions correctly (≥80%) and complete all 33 lessons across Levels 1–5 to unlock your official Completion Certificate.
                </p>
              </div>

              {!courseProgress.allLessonsCompleted && (
                <button
                  type="button"
                  onClick={() =>
                    setCompletedLessonIds(ALL_GIT_LESSONS.map((l) => l.id))
                  }
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-display font-bold shrink-0 cursor-pointer"
                >
                  Mark All 33 Lessons Complete ({courseProgress.completedCount}/33)
                </button>
              )}
            </div>

            {!courseProgress.allLessonsCompleted && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs sm:text-sm text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-900">
                    Curriculum Completion Requirement ({courseProgress.completedCount} of 33 lessons completed)
                  </strong>
                  <span>
                    You can take the Final Assessment now, and your score will be saved. Remember that all 33 lessons must also be marked complete before the Certificate unlocks!
                  </span>
                </div>
              </div>
            )}

            {/* Submission Result Banner */}
            {assessmentSubmission && (
              <div
                data-testid="assessment-result-banner"
                className={`p-6 rounded-2xl border-2 space-y-4 ${
                  assessmentSubmission.passed
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {assessmentSubmission.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <h3 className="font-display text-xl font-extrabold">
                        {assessmentSubmission.passed
                          ? `Assessment Passed! Score: ${assessmentSubmission.scorePercentage}% (${assessmentSubmission.correctCount}/${assessmentSubmission.totalQuestions})`
                          : `Score: ${assessmentSubmission.scorePercentage}% (${assessmentSubmission.correctCount}/${assessmentSubmission.totalQuestions}) — 80% Required to Pass`}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm">
                      {assessmentSubmission.passed
                        ? courseProgress.allLessonsCompleted
                          ? 'Congratulations! You have completed all 33 lessons and passed the Final Assessment. Your Completion Certificate is now unlocked!'
                          : 'You passed the Final Assessment! Complete the remaining curriculum lessons to unlock your Completion Certificate.'
                        : 'Review the explanations below and click "Retake Assessment" to try again. The Completion Certificate remains locked until you score at least 80%.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {assessmentSubmission.passed &&
                      courseProgress.allLessonsCompleted && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('certificate')}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          <span>Open Completion Certificate</span>
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={handleRetakeFinalAssessment}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs sm:text-sm font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake Assessment</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 18 Questions Form */}
            <form onSubmit={handleSubmitFinalAssessment} className="space-y-6">
              {FINAL_ASSESSMENT_QUESTIONS.map((q, index) => {
                const currentAnswer = assessmentAnswers[q.id];
                const gradeDetail = assessmentSubmission?.details[q.id];

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      gradeDetail
                        ? gradeDetail.correct
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-red-50/40 border-red-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-blue-700">
                        Question {index + 1} of {FINAL_ASSESSMENT_QUESTIONS.length} • Level {q.levelNumber}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700">
                        {q.type === 'command-input'
                          ? 'Command Scenario'
                          : 'Multiple Choice'}
                      </span>
                    </div>

                    <p className="font-display text-sm sm:text-base font-bold text-[#0A0A0A]">
                      {q.question}
                    </p>

                    {q.scenario && (
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                        Scenario: {q.scenario}
                      </p>
                    )}

                    {q.type === 'multiple-choice' && q.options ? (
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = currentAnswer === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer text-xs sm:text-sm transition-all ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-600 text-[#0A0A0A] font-semibold'
                                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`fa-${q.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setAssessmentAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx
                                  }))
                                }
                                className="mt-0.5 accent-blue-600"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-xs sm:text-sm">
                        <span className="text-blue-600 font-bold">$</span>
                        <input
                          type="text"
                          value={String(currentAnswer ?? '')}
                          onChange={(e) =>
                            setAssessmentAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value
                            }))
                          }
                          placeholder={q.placeholder || 'git ...'}
                          aria-label={`Command answer for ${q.id}`}
                          className="flex-1 bg-transparent text-[#0A0A0A] focus:outline-none"
                        />
                      </div>
                    )}

                    {gradeDetail && (
                      <div
                        className={`p-3 rounded-xl text-xs space-y-1 border ${
                          gradeDetail.correct
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-red-50 border-red-200 text-red-950'
                        }`}
                      >
                        <div className="font-bold">
                          {gradeDetail.correct
                            ? '✓ Correct'
                            : `✕ Incorrect — Expected: ${gradeDetail.expectedSummary}`}
                        </div>
                        <div>{gradeDetail.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleRetakeFinalAssessment}
                  className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs sm:text-sm font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Answers</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Final Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: COMPLETION CERTIFICATE (UNLOCKED OR LOCKED GATE)             */}
      {/* =================================================================== */}
      {activeTab === 'certificate' && (
        <div className="max-w-5xl mx-auto">
          {certificateUnlocked && assessmentRecord ? (
            <GitCertificate
              profile={profile}
              assessmentRecord={assessmentRecord}
              onUpdateAssessmentRecord={(updated) => setAssessmentRecord(updated)}
              onOpenPortfolio={onOpenPortfolio}
            />
          ) : (
            <div
              data-testid="certificate-locked-panel"
              className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xs text-center max-w-2xl mx-auto space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-slate-600" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl font-extrabold text-[#0A0A0A]">
                  Completion Certificate Locked
                </h2>
                <p className="text-sm text-slate-700">
                  To unlock your verifiable{' '}
                  <strong className="text-[#0A0A0A]">
                    DevSync Git &amp; Open-Source Contribution Certification
                  </strong>
                  , complete both requirements below:
                </p>
              </div>

              <div className="space-y-3 text-left max-w-md mx-auto">
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    courseProgress.allLessonsCompleted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {courseProgress.allLessonsCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-display text-xs sm:text-sm font-bold">
                        1. Complete All 5 Levels (33 Lessons)
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        Current: {courseProgress.completedCount} / 33 completed
                      </div>
                    </div>
                  </div>
                  {!courseProgress.allLessonsCompleted && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('curriculum')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold cursor-pointer"
                    >
                      Continue
                    </button>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    assessmentRecord?.passed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {assessmentRecord?.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ListChecks className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-display text-xs sm:text-sm font-bold">
                        2. Pass Final Assessment (≥80%)
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        Best Score:{' '}
                        {assessmentRecord
                          ? `${assessmentRecord.bestScore}%`
                          : 'Not attempted yet'}
                      </div>
                    </div>
                  </div>
                  {!assessmentRecord?.passed && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('assessment')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold cursor-pointer"
                    >
                      Take Exam
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

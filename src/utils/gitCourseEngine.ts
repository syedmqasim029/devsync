import {
  ALL_GIT_LESSONS,
  FINAL_ASSESSMENT_QUESTIONS,
  FinalAssessmentQuestion,
  GIT_CURRICULUM_LEVELS,
  GitLesson
} from '../data/gitCurriculum';

export const STORAGE_KEY_GIT_COMPLETED = 'devsync_git_completed_steps_v1';
export const STORAGE_KEY_GIT_ASSESSMENT = 'devsync_git_assessment_v1';
export const PASSING_SCORE_PERCENTAGE = 80;

export type LevelCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export interface LevelProgressSummary {
  levelId: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  status: LevelCompletionStatus;
}

export interface OverallCourseProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  allLessonsCompleted: boolean;
  levelSummaries: Record<string, LevelProgressSummary>;
}

export interface QuestionGradeDetail {
  questionId: string;
  correct: boolean;
  userAnswer: string | number | undefined;
  expectedSummary: string;
  explanation: string;
}

export interface FinalAssessmentGrade {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  passed: boolean;
  details: Record<string, QuestionGradeDetail>;
}

export interface GitAssessmentRecord {
  attempts: number;
  bestScore: number;
  lastScore: number;
  passed: boolean;
  lastAttemptAt: string;
  passedAt?: string;
  certificateId?: string;
  studentName?: string;
  sharedOnPortfolio?: boolean;
}

const VALID_LESSON_IDS = new Set(ALL_GIT_LESSONS.map((l) => l.id));

/**
 * Normalizes legacy numeric step arrays (e.g. [1, 2]) or string lesson ID arrays
 * into a deduplicated array of valid lesson IDs ('lesson-1' .. 'lesson-33').
 */
export function normalizeCompletedLessonIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const result = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'number' && Number.isInteger(item)) {
      const candidate = `lesson-${item}`;
      if (VALID_LESSON_IDS.has(candidate)) {
        result.add(candidate);
      }
    } else if (typeof item === 'string') {
      const trimmed = item.trim();
      if (VALID_LESSON_IDS.has(trimmed)) {
        result.add(trimmed);
      } else if (/^\d+$/.test(trimmed)) {
        const candidate = `lesson-${trimmed}`;
        if (VALID_LESSON_IDS.has(candidate)) {
          result.add(candidate);
        }
      }
    }
  }
  return Array.from(result);
}

/**
 * Normalizes a CLI command string for comparison (collapses whitespace, strips leading `$`).
 */
export function normalizeGitCommand(input: string): string {
  return String(input || '')
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/["']/g, '"')
    .toLowerCase();
}

/**
 * Validates a student's answer to a lesson's interactive "Verify Your Understanding" check.
 */
export function validateLessonQuizAnswer(
  lesson: GitLesson,
  userAnswer: string | number | null | undefined
): { correct: boolean; feedback: string } {
  const { quiz } = lesson;

  if (quiz.type === 'multiple-choice') {
    const selectedIndex =
      typeof userAnswer === 'number' ? userAnswer : Number(userAnswer);
    if (
      Number.isNaN(selectedIndex) ||
      userAnswer === null ||
      userAnswer === undefined ||
      userAnswer === ''
    ) {
      return {
        correct: false,
        feedback: 'Please select an answer option to verify your understanding.'
      };
    }

    const isCorrect = selectedIndex === quiz.correctOptionIndex;
    return {
      correct: isCorrect,
      feedback: isCorrect
        ? `Correct! ${quiz.explanation}`
        : `Not quite. Hint: ${quiz.hint}`
    };
  }

  // Command input validation
  const normalizedUser = normalizeGitCommand(String(userAnswer ?? ''));
  if (!normalizedUser) {
    return {
      correct: false,
      feedback: 'Please type the Git command in the input box.'
    };
  }

  const accepted = (quiz.acceptedCommands || []).map(normalizeGitCommand);
  const isCorrect = accepted.includes(normalizedUser);

  return {
    correct: isCorrect,
    feedback: isCorrect
      ? `Correct command! ${quiz.explanation}`
      : `Command didn't match expected syntax. Hint: ${quiz.hint}`
  };
}

/**
 * Calculates completion progress for a specific curriculum level.
 */
export function calculateLevelProgress(
  levelId: string,
  completedIds: Iterable<string>
): LevelProgressSummary {
  const completedSet = new Set(completedIds);
  const level = GIT_CURRICULUM_LEVELS.find((l) => l.id === levelId);
  if (!level || level.lessons.length === 0) {
    return {
      levelId,
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
      status: 'not_started'
    };
  }

  const completedCount = level.lessons.filter((lesson) =>
    completedSet.has(lesson.id)
  ).length;
  const totalCount = level.lessons.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  let status: LevelCompletionStatus = 'not_started';
  if (completedCount === totalCount) {
    status = 'completed';
  } else if (completedCount > 0) {
    status = 'in_progress';
  }

  return {
    levelId,
    completedCount,
    totalCount,
    percentage,
    status
  };
}

/**
 * Calculates overall progress across all 5 levels and 33 lessons.
 */
export function calculateOverallCourseProgress(
  completedIds: Iterable<string>
): OverallCourseProgress {
  const completedSet = new Set(completedIds);
  const totalCount = ALL_GIT_LESSONS.length;
  const completedCount = ALL_GIT_LESSONS.filter((lesson) =>
    completedSet.has(lesson.id)
  ).length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const levelSummaries: Record<string, LevelProgressSummary> = {};
  for (const level of GIT_CURRICULUM_LEVELS) {
    levelSummaries[level.id] = calculateLevelProgress(level.id, completedSet);
  }

  return {
    completedCount,
    totalCount,
    percentage,
    allLessonsCompleted: totalCount > 0 && completedCount === totalCount,
    levelSummaries
  };
}

/**
 * Grades a full submission of the Final Assessment (18 questions, ≥80% required to pass).
 */
export function gradeFinalAssessment(
  answers: Record<string, string | number>,
  questions: FinalAssessmentQuestion[] = FINAL_ASSESSMENT_QUESTIONS
): FinalAssessmentGrade {
  let correctCount = 0;
  const details: Record<string, QuestionGradeDetail> = {};

  for (const q of questions) {
    const rawAnswer = answers[q.id];
    let isCorrect = false;
    let expectedSummary = '';

    if (q.type === 'multiple-choice') {
      const idx = typeof rawAnswer === 'number' ? rawAnswer : Number(rawAnswer);
      isCorrect =
        rawAnswer !== undefined &&
        rawAnswer !== '' &&
        !Number.isNaN(idx) &&
        idx === q.correctOptionIndex;
      expectedSummary =
        q.options && q.correctOptionIndex !== undefined
          ? q.options[q.correctOptionIndex]
          : '';
    } else {
      const normalizedUser = normalizeGitCommand(String(rawAnswer ?? ''));
      const accepted = (q.acceptedCommands || []).map(normalizeGitCommand);
      isCorrect = normalizedUser.length > 0 && accepted.includes(normalizedUser);
      expectedSummary = (q.acceptedCommands || [])[0] || '';
    }

    if (isCorrect) {
      correctCount += 1;
    }

    details[q.id] = {
      questionId: q.id,
      correct: isCorrect,
      userAnswer: rawAnswer,
      expectedSummary,
      explanation: q.explanation
    };
  }

  const totalQuestions = questions.length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercentage >= PASSING_SCORE_PERCENTAGE;

  return {
    correctCount,
    totalQuestions,
    scorePercentage,
    passed,
    details
  };
}

/**
 * Generates a deterministic, verifiable Certificate ID from the student's identifier and completion date.
 * Example output: DS-GIT-2026-8F4A2C91
 */
export function generateCertificateId(
  studentIdentifier: string,
  timestampIso: string
): string {
  const cleanId = (studentIdentifier || 'student').trim().toLowerCase();
  const seed = `${cleanId}::devsync-git-cert::${timestampIso}`;
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;

  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hexPart =
    ((h1 >>> 0).toString(16).padStart(8, '0').slice(0, 4) +
      (h2 >>> 0).toString(16).padStart(8, '0').slice(0, 4)).toUpperCase();
  const year = new Date(timestampIso).getUTCFullYear() || 2026;

  return `DS-GIT-${year}-${hexPart}`;
}

/**
 * Checks if the Completion Certificate is unlocked:
 * Requires ALL 33 lessons across all 5 levels completed AND Final Assessment passed (≥80%).
 */
export function isCertificateUnlocked(
  completedIds: Iterable<string>,
  assessmentRecord: GitAssessmentRecord | null | undefined
): boolean {
  const overall = calculateOverallCourseProgress(completedIds);
  if (!overall.allLessonsCompleted) {
    return false;
  }
  if (!assessmentRecord || !assessmentRecord.passed) {
    return false;
  }
  return assessmentRecord.bestScore >= PASSING_SCORE_PERCENTAGE;
}

/**
 * Browser localStorage helpers for reading/writing completed lessons and assessment state.
 */
export function loadCompletedLessonsFromStorage(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_GIT_COMPLETED);
    if (!raw) return [];
    return normalizeCompletedLessonIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCompletedLessonsToStorage(lessonIds: Iterable<string>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const normalized = normalizeCompletedLessonIds(Array.from(lessonIds));
    window.localStorage.setItem(
      STORAGE_KEY_GIT_COMPLETED,
      JSON.stringify(normalized)
    );
  } catch (e) {
    console.error('Failed to persist Git course progress', e);
  }
}

export function loadAssessmentFromStorage(): GitAssessmentRecord | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_GIT_ASSESSMENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GitAssessmentRecord;
    if (typeof parsed.bestScore !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAssessmentToStorage(record: GitAssessmentRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_GIT_ASSESSMENT,
      JSON.stringify(record)
    );
  } catch (e) {
    console.error('Failed to persist Git assessment record', e);
  }
}

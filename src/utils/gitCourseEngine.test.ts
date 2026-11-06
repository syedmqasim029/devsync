import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_GIT_LESSONS,
  FINAL_ASSESSMENT_QUESTIONS,
  GIT_CURRICULUM_LEVELS
} from '../data/gitCurriculum';
import {
  calculateLevelProgress,
  calculateOverallCourseProgress,
  generateCertificateId,
  gradeFinalAssessment,
  isCertificateUnlocked,
  normalizeCompletedLessonIds,
  validateLessonQuizAnswer
} from './gitCourseEngine';

describe('Git & GitHub 5-Level Curriculum Structure', () => {
  it('contains all 5 levels and 33 structured lessons with commands, pitfalls, and quizzes', () => {
    assert.equal(GIT_CURRICULUM_LEVELS.length, 5);
    assert.equal(ALL_GIT_LESSONS.length, 33);

    for (const lesson of ALL_GIT_LESSONS) {
      assert.ok(lesson.id.startsWith('lesson-'));
      assert.ok(lesson.title.length > 0);
      assert.ok(lesson.conceptParagraphs.length >= 2);
      assert.ok(lesson.commands.length >= 1);
      assert.ok(lesson.expectedOutput.length > 0);
      assert.ok(lesson.commonPitfall.title.length > 0);
      assert.ok(lesson.quiz.question.length > 0);
    }
  });

  it('normalizes legacy numeric step IDs and string lesson IDs accurately', () => {
    const normalized = normalizeCompletedLessonIds([
      1,
      2,
      'lesson-3',
      '4',
      'invalid-999',
      1
    ]);
    assert.deepEqual(normalized, [
      'lesson-1',
      'lesson-2',
      'lesson-3',
      'lesson-4'
    ]);
  });

  it('computes per-level and overall course completion progress accurately', () => {
    const level1Ids = GIT_CURRICULUM_LEVELS[0].lessons.map((l) => l.id);
    const level1Summary = calculateLevelProgress('level-1', level1Ids);
    assert.equal(level1Summary.completedCount, 8);
    assert.equal(level1Summary.totalCount, 8);
    assert.equal(level1Summary.percentage, 100);
    assert.equal(level1Summary.status, 'completed');

    const partialOverall = calculateOverallCourseProgress(level1Ids);
    assert.equal(partialOverall.completedCount, 8);
    assert.equal(partialOverall.totalCount, 33);
    assert.equal(partialOverall.allLessonsCompleted, false);

    const allIds = ALL_GIT_LESSONS.map((l) => l.id);
    const fullOverall = calculateOverallCourseProgress(allIds);
    assert.equal(fullOverall.completedCount, 33);
    assert.equal(fullOverall.percentage, 100);
    assert.equal(fullOverall.allLessonsCompleted, true);
  });
});

describe('Lesson Quiz Validation & Final Assessment Grading', () => {
  it('validates multiple-choice and command-input lesson quizzes', () => {
    const mcLesson = ALL_GIT_LESSONS[0]; // lesson-1 (multiple-choice)
    const rightMc = validateLessonQuizAnswer(mcLesson, 0);
    assert.equal(rightMc.correct, true);

    const wrongMc = validateLessonQuizAnswer(mcLesson, 2);
    assert.equal(wrongMc.correct, false);

    const cmdLesson = ALL_GIT_LESSONS[1]; // lesson-2 (command-input: git config --list)
    const rightCmd = validateLessonQuizAnswer(
      cmdLesson,
      '$ git config   --list'
    );
    assert.equal(rightCmd.correct, true);

    const wrongCmd = validateLessonQuizAnswer(cmdLesson, 'git init');
    assert.equal(wrongCmd.correct, false);
  });

  it('blocks passing when Final Assessment score is below 80% and passes at >= 80%', () => {
    assert.equal(FINAL_ASSESSMENT_QUESTIONS.length, 18);

    // Fail scenario (only 2 correct)
    const failingAnswers: Record<string, string | number> = {
      'fa-1': 0,
      'fa-2': 'git diff --staged'
    };
    const failGrade = gradeFinalAssessment(failingAnswers);
    assert.equal(failGrade.correctCount, 2);
    assert.equal(failGrade.passed, false);
    assert.ok(failGrade.scorePercentage < 80);

    // Perfect pass scenario (all 18 correct)
    const passingAnswers: Record<string, string | number> = {};
    for (const q of FINAL_ASSESSMENT_QUESTIONS) {
      if (q.type === 'multiple-choice') {
        passingAnswers[q.id] = q.correctOptionIndex ?? 0;
      } else {
        passingAnswers[q.id] = q.acceptedCommands?.[0] ?? '';
      }
    }
    const passGrade = gradeFinalAssessment(passingAnswers);
    assert.equal(passGrade.correctCount, 18);
    assert.equal(passGrade.scorePercentage, 100);
    assert.equal(passGrade.passed, true);
  });

  it('unlocks Completion Certificate only when all 33 lessons are completed AND Final Assessment is passed (>=80%)', () => {
    const allLessonIds = ALL_GIT_LESSONS.map((l) => l.id);
    const partialLessonIds = allLessonIds.slice(0, 32);

    const failedRecord = {
      attempts: 1,
      bestScore: 50,
      lastScore: 50,
      passed: false,
      lastAttemptAt: '2026-11-06T00:00:00.000Z'
    };

    const passedRecord = {
      attempts: 2,
      bestScore: 94,
      lastScore: 94,
      passed: true,
      lastAttemptAt: '2026-11-06T01:00:00.000Z',
      passedAt: '2026-11-06T01:00:00.000Z'
    };

    // Locked if exam failed even with all 33 lessons completed
    assert.equal(isCertificateUnlocked(allLessonIds, failedRecord), false);

    // Locked if exam passed (94%) but only 32/33 lessons completed
    assert.equal(isCertificateUnlocked(partialLessonIds, passedRecord), false);

    // Unlocked when all 33 lessons completed AND exam passed (>=80%)
    assert.equal(isCertificateUnlocked(allLessonIds, passedRecord), true);

    // Certificate ID generation is deterministic and formatted properly
    const certId1 = generateCertificateId(
      'alex-rivera',
      '2026-11-06T01:00:00.000Z'
    );
    const certId2 = generateCertificateId(
      'alex-rivera',
      '2026-11-06T01:00:00.000Z'
    );
    assert.equal(certId1, certId2);
    assert.match(certId1, /^DS-GIT-2026-[0-9A-F]{8}$/);
  });
});

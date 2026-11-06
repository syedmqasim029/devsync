import { StudentProfile } from '../types';

export const AVAILABLE_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'HTML/CSS',
  'SQL',
  'PHP',
  'C#',
  'Ruby'
];

export const AVAILABLE_FRAMEWORKS = [
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'Tailwind CSS',
  'Django',
  'FastAPI',
  'Spring Boot',
  'Vue.js',
  'Angular',
  'Docker',
  'GraphQL',
  'PostgreSQL',
  'MongoDB'
];

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: 'Alex Rivera',
  university: 'State University of Technology',
  degree: 'B.S. in Computer Science (Year 3)',
  experienceLevel: 'First-Time Contributor',
  skills: {
    languages: ['TypeScript', 'Python', 'HTML/CSS'],
    frameworks: ['React', 'Tailwind CSS', 'Node.js']
  },
  interests: ['Frontend UI/UX', 'Developer Tools', 'Education Tech', 'Documentation'],
  preferredDifficulty: 'Beginner',
  hasCompletedOnboarding: false
};

/**
 * Safely normalizes any raw or legacy profile payload from localStorage
 * so `profile.skills.languages`, `profile.skills.frameworks`, and `profile.interests`
 * are guaranteed to be valid string arrays.
 */
export function normalizeStudentProfile(raw: unknown): StudentProfile {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_STUDENT_PROFILE;
  }

  const record = raw as Record<string, unknown>;
  const rawSkills =
    record.skills && typeof record.skills === 'object'
      ? (record.skills as Record<string, unknown>)
      : {};

  const candidateLanguages = Array.isArray(rawSkills.languages)
    ? rawSkills.languages
    : Array.isArray(record.languages)
    ? record.languages
    : Array.isArray(record.topLanguages)
    ? record.topLanguages
    : DEFAULT_STUDENT_PROFILE.skills.languages;

  const languages = candidateLanguages.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  const candidateFrameworks = Array.isArray(rawSkills.frameworks)
    ? rawSkills.frameworks
    : Array.isArray(record.frameworks)
    ? record.frameworks
    : DEFAULT_STUDENT_PROFILE.skills.frameworks;

  const frameworks = candidateFrameworks.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  const candidateInterests = Array.isArray(record.interests)
    ? record.interests
    : DEFAULT_STUDENT_PROFILE.interests;

  const interests = candidateInterests.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  const validExperienceLevels: StudentProfile['experienceLevel'][] = [
    'First-Time Contributor',
    'Familiar with Git',
    'Active Open-Source Contributor'
  ];
  const experienceLevel = validExperienceLevels.includes(
    record.experienceLevel as StudentProfile['experienceLevel']
  )
    ? (record.experienceLevel as StudentProfile['experienceLevel'])
    : DEFAULT_STUDENT_PROFILE.experienceLevel;

  const validDifficulties: StudentProfile['preferredDifficulty'][] = [
    'Beginner',
    'Intermediate',
    'All'
  ];
  const preferredDifficulty = validDifficulties.includes(
    record.preferredDifficulty as StudentProfile['preferredDifficulty']
  )
    ? (record.preferredDifficulty as StudentProfile['preferredDifficulty'])
    : DEFAULT_STUDENT_PROFILE.preferredDifficulty;

  return {
    name:
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name
        : DEFAULT_STUDENT_PROFILE.name,
    university:
      typeof record.university === 'string' && record.university.trim().length > 0
        ? record.university
        : DEFAULT_STUDENT_PROFILE.university,
    degree:
      typeof record.degree === 'string' && record.degree.trim().length > 0
        ? record.degree
        : DEFAULT_STUDENT_PROFILE.degree,
    githubUsername:
      typeof record.githubUsername === 'string' && record.githubUsername.trim().length > 0
        ? record.githubUsername.trim()
        : undefined,
    isPro: typeof record.isPro === 'boolean' ? record.isPro : undefined,
    experienceLevel,
    skills: {
      languages:
        languages.length > 0 ? languages : DEFAULT_STUDENT_PROFILE.skills.languages,
      frameworks
    },
    interests:
      interests.length > 0 ? interests : DEFAULT_STUDENT_PROFILE.interests,
    preferredDifficulty,
    hasCompletedOnboarding:
      typeof record.hasCompletedOnboarding === 'boolean'
        ? record.hasCompletedOnboarding
        : DEFAULT_STUDENT_PROFILE.hasCompletedOnboarding
  };
}


import { GitHubIssue } from '../types';

export const MOCK_GITHUB_ISSUES: GitHubIssue[] = [
  {
    id: 'mock-issue-1',
    number: 11420,
    title: 'Add keyboard navigation support (Escape & Arrow keys) to dropdown filter menu',
    repoName: 'vercel/next.js',
    repoOwner: 'vercel',
    repoUrl: 'https://github.com/vercel/next.js',
    issueUrl: 'https://github.com/vercel/next.js/issues',
    language: 'TypeScript',
    requiredSkills: ['TypeScript', 'React', 'Next.js', 'HTML/CSS'],
    labels: ['good first issue', 'accessibility', 'area: dev-tools'],
    difficulty: 'Beginner',
    estimatedEffort: '2–4 hours',
    summary:
      'Currently the developer overlay filter menu only closes on outside mouse click. Add Escape key dismissal and Up/Down arrow key focus management with unit test coverage.',
    mentorAvailable: true,
    commentsCount: 3,
    assigneeCount: 0,
    createdAt: '2025-02-14T10:00:00Z',
    updatedAt: '2025-02-20T14:30:00Z',
    organizationType: 'Full-Stack Framework',
    setupSteps: [
      'git clone https://github.com/vercel/next.js.git',
      'cd next.js',
      'pnpm install',
      'git checkout -b fix/dropdown-keyboard-nav'
    ]
  },
  {
    id: 'mock-issue-2',
    number: 5832,
    title: 'Clarify async generator yield dependency teardown order in tutorial documentation',
    repoName: 'fastapi/fastapi',
    repoOwner: 'fastapi',
    repoUrl: 'https://github.com/fastapi/fastapi',
    issueUrl: 'https://github.com/fastapi/fastapi/issues',
    language: 'Python',
    requiredSkills: ['Python', 'FastAPI'],
    labels: ['good first issue', 'documentation', 'help wanted'],
    difficulty: 'Beginner',
    estimatedEffort: '1–2 hours',
    summary:
      'First-time users frequently ask when code after `yield` executes relative to background tasks. Add a clear diagram and annotated code example in docs/en/docs/tutorial/dependencies/dependencies-with-yield.md.',
    mentorAvailable: true,
    commentsCount: 2,
    assigneeCount: 0,
    createdAt: '2025-02-10T08:15:00Z',
    updatedAt: '2025-02-19T11:20:00Z',
    organizationType: 'Backend Framework',
    setupSteps: [
      'git clone https://github.com/fastapi/fastapi.git',
      'cd fastapi',
      'python -m venv .venv && source .venv/bin/activate',
      'pip install -r requirements.txt'
    ]
  },
  {
    id: 'mock-issue-3',
    number: 13804,
    title: 'Fix responsive table horizontal overflow on 375px mobile viewports in docs site',
    repoName: 'tailwindlabs/tailwindcss',
    repoOwner: 'tailwindlabs',
    repoUrl: 'https://github.com/tailwindlabs/tailwindcss',
    issueUrl: 'https://github.com/tailwindlabs/tailwindcss/issues',
    language: 'TypeScript',
    requiredSkills: ['TypeScript', 'React', 'Tailwind CSS', 'HTML/CSS'],
    labels: ['good first issue', 'css', 'ui'],
    difficulty: 'Beginner',
    estimatedEffort: '2–4 hours',
    summary:
      'Utility reference tables with long class names cause horizontal page scrolling on mobile devices. Wrap reference tables in an overflow-x-auto container with subtle scroll indicators.',
    mentorAvailable: true,
    commentsCount: 1,
    assigneeCount: 0,
    createdAt: '2025-02-11T16:40:00Z',
    updatedAt: '2025-02-21T09:10:00Z',
    organizationType: 'CSS Framework',
    setupSteps: [
      'git clone https://github.com/tailwindlabs/tailwindcss.git',
      'cd tailwindcss',
      'npm install',
      'git checkout -b fix/mobile-table-overflow'
    ]
  },
  {
    id: 'mock-issue-4',
    number: 29110,
    title: 'Add descriptive error message when PostgreSQL connection string port is non-numeric',
    repoName: 'supabase/supabase',
    repoOwner: 'supabase',
    repoUrl: 'https://github.com/supabase/supabase',
    issueUrl: 'https://github.com/supabase/supabase/issues',
    language: 'TypeScript',
    requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'SQL'],
    labels: ['good first issue', 'dx', 'cli'],
    difficulty: 'Beginner',
    estimatedEffort: '2–4 hours',
    summary:
      'When a student accidentally passes an unescaped special character in the database password, the URL parser reports a cryptic port error. Validate the connection URL and surface a clear troubleshooting hint.',
    mentorAvailable: true,
    commentsCount: 4,
    assigneeCount: 0,
    createdAt: '2025-02-12T12:00:00Z',
    updatedAt: '2025-02-18T17:45:00Z',
    organizationType: 'Developer Platform',
    setupSteps: [
      'git clone https://github.com/supabase/supabase.git',
      'cd supabase',
      'npm install',
      'git checkout -b fix/db-url-validation-message'
    ]
  },
  {
    id: 'mock-issue-5',
    number: 18492,
    title: 'Add unit tests for QuerySet.explain() format validation on SQLite and PostgreSQL backends',
    repoName: 'django/django',
    repoOwner: 'django',
    repoUrl: 'https://github.com/django/django',
    issueUrl: 'https://github.com/django/django/issues',
    language: 'Python',
    requiredSkills: ['Python', 'Django', 'SQL', 'PostgreSQL'],
    labels: ['good first issue', 'easy pickings', 'testing'],
    difficulty: 'Beginner',
    estimatedEffort: '4–8 hours',
    summary:
      'Expand regression test coverage in tests/queries/test_explain.py to verify that invalid format arguments raise ValueError consistently across database backends.',
    mentorAvailable: true,
    commentsCount: 2,
    assigneeCount: 0,
    createdAt: '2025-02-08T09:30:00Z',
    updatedAt: '2025-02-17T15:00:00Z',
    organizationType: 'Web Framework',
    setupSteps: [
      'git clone https://github.com/django/django.git',
      'cd django',
      'python -m venv .venv && source .venv/bin/activate',
      'pip install -e . && cd tests && ./runtests.py queries.test_explain'
    ]
  },
  {
    id: 'mock-issue-6',
    number: 51204,
    title: 'Expose `--json` output flag on `cargo metadata` diagnostic warnings summary',
    repoName: 'rust-lang/cargo',
    repoOwner: 'rust-lang',
    repoUrl: 'https://github.com/rust-lang/cargo',
    issueUrl: 'https://github.com/rust-lang/cargo/issues',
    language: 'Rust',
    requiredSkills: ['Rust'],
    labels: ['E-easy', 'good first issue', 'A-diagnostics'],
    difficulty: 'Intermediate',
    estimatedEffort: '4–8 hours',
    summary:
      'Allow IDE integrations and student CLI tools to parse workspace manifest deprecation warnings in structured JSON format when `--message-format=json` is passed.',
    mentorAvailable: true,
    commentsCount: 3,
    assigneeCount: 0,
    createdAt: '2025-02-05T14:20:00Z',
    updatedAt: '2025-02-16T20:10:00Z',
    organizationType: 'Systems Toolchain',
    setupSteps: [
      'git clone https://github.com/rust-lang/cargo.git',
      'cd cargo',
      'cargo test --test testsuite'
    ]
  }
];

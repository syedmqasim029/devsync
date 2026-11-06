export interface SubOrganizationMeta {
  handle: string;
  label: string;
  focusArea: string;
  primaryLanguage: string;
}

export interface OrganizationConfigItem {
  id: string;
  name: string;
  category: string;
  description: string;
  isUmbrella: boolean;
  githubHandle?: string;
  subOrgs?: string[];
  subOrgMeta?: SubOrganizationMeta[];
  recommendedLanguages: string[];
}

/**
 * Predefined Open-Source Umbrella Foundations & Ecosystems (Epic 5).
 * Maps multi-org foundations (like CNCF, Linux Foundation AI, and Web Ecosystems)
 * to their official GitHub organization handles.
 */
export const featuredOrganizations: OrganizationConfigItem[] = [
  {
    id: 'cncf-umbrella',
    name: 'Cloud Native Computing Foundation (CNCF)',
    category: 'Cloud & Distributed Systems Umbrella',
    description:
      'Graduated and incubating cloud-native infrastructure projects with active contributor mentorship and structured good-first-issue triage.',
    isUmbrella: true,
    subOrgs: ['kubernetes', 'prometheus', 'envoyproxy', 'helm', 'containerd', 'cilium'],
    subOrgMeta: [
      {
        handle: 'kubernetes',
        label: 'Kubernetes',
        focusArea: 'Container Orchestration & CLI Tools (kubectl, kubeadm)',
        primaryLanguage: 'Go',
      },
      {
        handle: 'prometheus',
        label: 'Prometheus',
        focusArea: 'Time-Series Monitoring, Alerting & Exporters',
        primaryLanguage: 'Go',
      },
      {
        handle: 'envoyproxy',
        label: 'Envoy Proxy',
        focusArea: 'Cloud-Native High-Performance Service Proxy',
        primaryLanguage: 'C++',
      },
      {
        handle: 'helm',
        label: 'Helm',
        focusArea: 'The Kubernetes Package Manager & Charts CLI',
        primaryLanguage: 'Go',
      },
      {
        handle: 'containerd',
        label: 'containerd',
        focusArea: 'Industry-Standard Container Runtime',
        primaryLanguage: 'Go',
      },
      {
        handle: 'cilium',
        label: 'Cilium',
        focusArea: 'eBPF-based Networking, Observability & Security',
        primaryLanguage: 'Go',
      },
    ],
    recommendedLanguages: ['Go', 'C++', 'TypeScript', 'Python'],
  },
  {
    id: 'lf-ai-data-umbrella',
    name: 'OpenJS & Modern Web Foundation',
    category: 'JavaScript & Web Standards Umbrella',
    description:
      'Umbrella ecosystem governing core JavaScript runtimes, build tools, testing frameworks, and web standards.',
    isUmbrella: true,
    subOrgs: ['nodejs', 'vitejs', 'webpack', 'eslint', 'jestjs'],
    subOrgMeta: [
      {
        handle: 'nodejs',
        label: 'Node.js Foundation',
        focusArea: 'JavaScript Server Runtime, Core Libraries & Docs',
        primaryLanguage: 'JavaScript',
      },
      {
        handle: 'vitejs',
        label: 'Vite Ecosystem',
        focusArea: 'Next-Generation Frontend Build Tooling',
        primaryLanguage: 'TypeScript',
      },
      {
        handle: 'eslint',
        label: 'ESLint',
        focusArea: 'AST Linting Rules, Parser Tooling & Developer Experience',
        primaryLanguage: 'JavaScript',
      },
      {
        handle: 'webpack',
        label: 'Webpack',
        focusArea: 'Module Bundler, Loaders & Plugin Ecosystem',
        primaryLanguage: 'JavaScript',
      },
      {
        handle: 'jestjs',
        label: 'Jest',
        focusArea: 'Delightful JavaScript Unit Testing Framework',
        primaryLanguage: 'TypeScript',
      },
    ],
    recommendedLanguages: ['TypeScript', 'JavaScript'],
  },
  {
    id: 'scientific-python-umbrella',
    name: 'Scientific Python & AI Ecosystem',
    category: 'Data Science & Machine Learning Umbrella',
    description:
      'Foundational open-source organizations powering university AI/ML coursework, numerical computing, and data visualization.',
    isUmbrella: true,
    subOrgs: ['pytorch', 'scikit-learn', 'pandas-dev', 'jupyter', 'huggingface'],
    subOrgMeta: [
      {
        handle: 'huggingface',
        label: 'Hugging Face',
        focusArea: 'Transformers, Diffusers, Datasets & Open-Source AI Hub',
        primaryLanguage: 'Python',
      },
      {
        handle: 'scikit-learn',
        label: 'scikit-learn',
        focusArea: 'Machine Learning Algorithms & Pedagogical Documentation',
        primaryLanguage: 'Python',
      },
      {
        handle: 'pandas-dev',
        label: 'pandas',
        focusArea: 'Data Analysis & Tabular DataFrames in Python',
        primaryLanguage: 'Python',
      },
      {
        handle: 'jupyter',
        label: 'Project Jupyter',
        focusArea: 'Interactive Computing Notebooks & JupyterLab UI',
        primaryLanguage: 'Python',
      },
      {
        handle: 'pytorch',
        label: 'PyTorch',
        focusArea: 'Tensors & Dynamic Neural Networks in Python/C++',
        primaryLanguage: 'Python',
      },
    ],
    recommendedLanguages: ['Python', 'C++', 'TypeScript'],
  },
  {
    id: 'vercel-ecosystem',
    name: 'Vercel Ecosystem',
    category: 'Frontend & Full-Stack Cloud',
    description:
      'Creators of Next.js, Turborepo, SWR, and AI SDK — ideal for university students experienced in React and TypeScript.',
    isUmbrella: false,
    githubHandle: 'vercel',
    recommendedLanguages: ['TypeScript', 'JavaScript', 'Rust'],
  },
  {
    id: 'supabase-ecosystem',
    name: 'Supabase',
    category: 'Open-Source Backend & Postgres',
    description:
      'Open-source Firebase alternative built on PostgreSQL, React Studio dashboards, edge functions, and client SDKs.',
    isUmbrella: false,
    githubHandle: 'supabase',
    recommendedLanguages: ['TypeScript', 'Python', 'Go', 'SQL'],
  },
  {
    id: 'microsoft-oss',
    name: 'Microsoft Open Source',
    category: 'Developer Tools & Languages',
    description:
      'Home to VS Code, TypeScript, Playwright, and PowerToys with thousands of well-documented beginner issues.',
    isUmbrella: false,
    githubHandle: 'microsoft',
    recommendedLanguages: ['TypeScript', 'Python', 'C#', 'Rust'],
  },
  {
    id: 'apache-foundation',
    name: 'Apache Software Foundation',
    category: 'Enterprise & Big Data Ecosystem',
    description:
      'World-renowned open-source foundation maintaining Kafka, Spark, Airflow, Superset, and ECharts.',
    isUmbrella: false,
    githubHandle: 'apache',
    recommendedLanguages: ['Java', 'Python', 'TypeScript', 'Go'],
  },
  {
    id: 'rust-lang-ecosystem',
    name: 'Rust Project (rust-lang)',
    category: 'Systems Programming & Compilers',
    description:
      'Official Rust compiler, Cargo package manager, Rustlings interactive exercises, and documentation repositories.',
    isUmbrella: false,
    githubHandle: 'rust-lang',
    recommendedLanguages: ['Rust', 'TOML'],
  },
];

/**
 * Pure validation helper for custom GitHub organization handles (Error Prevention heuristic).
 */
export function validateGitHubOrgHandle(rawInput: string): {
  valid: boolean;
  normalizedHandle: string;
  error: string | null;
} {
  const trimmed = rawInput.trim().replace(/^@/, '');
  if (!trimmed) {
    return {
      valid: false,
      normalizedHandle: '',
      error: 'Enter a GitHub organization handle (e.g., "vercel", "supabase", or "facebook").',
    };
  }

  // Extract handle if the student pasted a full https://github.com/{org} URL
  const urlMatch = trimmed.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9-_.]+)\/?$/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;

  const handleRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  if (!handleRegex.test(candidate)) {
    return {
      valid: false,
      normalizedHandle: candidate,
      error:
        'Invalid GitHub organization handle. Use letters, numbers, and single hyphens only (no spaces or slashes), e.g., "vercel" or "scikit-learn".',
    };
  }

  return {
    valid: true,
    normalizedHandle: candidate,
    error: null,
  };
}

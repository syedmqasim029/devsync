import { GoogleGenAI, Type } from '@google/genai';
import type { AISetupAnalysis, LiveRepoContext } from '../src/types';

/**
 * Deterministic, context-grounded heuristic onboarding guide generator.
 * Used when GEMINI_API_KEY is not configured or when upstream AI quota is exhausted.
 * Extracts actual scripts and dependencies from `manifestSummary`, `rootFiles`, `README.md`, and `CONTRIBUTING.md`.
 */
export function buildHeuristicSetupAnalysis(
  owner: string,
  repo: string,
  repoContext: LiveRepoContext,
  issueTitle?: string,
  issueSummary?: string
): AISetupAnalysis {
  const verifiedContextFiles: string[] = [];
  if (repoContext.readmeSnippet) verifiedContextFiles.push('README.md');
  if (repoContext.contributingSnippet) verifiedContextFiles.push('CONTRIBUTING.md');
  if (repoContext.manifestSummary) {
    const manifestName = repoContext.manifestSummary.split(/[\s:]/)[0];
    if (manifestName) verifiedContextFiles.push(manifestName);
  }
  if (repoContext.rootFiles && repoContext.rootFiles.length > 0) {
    verifiedContextFiles.push(`Root Tree (${repoContext.rootFiles.length} entries)`);
  }

  const lang = (repoContext.language || '').toLowerCase();
  const rootFiles = repoContext.rootFiles || [];
  const manifest = repoContext.manifestSummary || '';

  let prerequisites: string[] = ['Git 2.30+', 'GitHub CLI (gh) or web fork workflow'];
  let setupCommands: string[] = [
    `git clone https://github.com/${owner}/${repo}.git`,
    `cd ${repo}`,
    `git checkout -b fix/issue-contribution`
  ];
  let testingInstructions: string[] = [];

  if (lang.includes('python') || rootFiles.includes('pyproject.toml') || rootFiles.includes('requirements.txt')) {
    prerequisites.push('Python 3.10+ & virtual environment (venv / poetry)');
    setupCommands.push(
      'python -m venv .venv && source .venv/bin/activate',
      rootFiles.includes('pyproject.toml') ? 'pip install -e ".[dev]"' : 'pip install -r requirements.txt'
    );
    testingInstructions = [
      'Run the Python test suite via `pytest` before and after your changes.',
      'Check code formatting and linting (e.g., `ruff check .` or `flake8`).'
    ];
  } else if (lang.includes('rust') || rootFiles.includes('Cargo.toml')) {
    prerequisites.push('Rust stable toolchain (rustup & cargo)');
    setupCommands.push('cargo check', 'cargo test');
    testingInstructions = [
      'Execute `cargo test` to verify unit and integration tests pass.',
      'Run `cargo clippy` and `cargo fmt --check` before committing.'
    ];
  } else if (lang.includes('go') || rootFiles.includes('go.mod')) {
    prerequisites.push('Go 1.21+ toolchain');
    setupCommands.push('go mod download', 'go test ./...');
    testingInstructions = [
      'Run `go test ./...` across all packages.',
      'Ensure `go vet ./...` reports zero warnings.'
    ];
  } else {
    // Default JS/TS or multi-language workflow
    const usesPnpm = rootFiles.includes('pnpm-lock.yaml') || manifest.includes('pnpm');
    const usesYarn = rootFiles.includes('yarn.lock') || manifest.includes('yarn');
    const pkgCmd = usesPnpm ? 'pnpm' : usesYarn ? 'yarn' : 'npm';

    prerequisites.push(`Node.js 20+ LTS & ${pkgCmd}`);
    setupCommands.push(`${pkgCmd} install`);
    if (manifest.includes('build:')) {
      setupCommands.push(`${pkgCmd} run build`);
    }
    testingInstructions = [
      `Run \`${pkgCmd} test\` (or \`${pkgCmd} run lint\`) to validate your change against existing checks.`,
      'Verify there are no TypeScript or bundler regressions before pushing your branch.'
    ];
  }

  // Highlight relevant top-level directories from actual rootFiles
  const relevantDirs = rootFiles
    .filter((f) => f.endsWith('/') || ['README.md', 'CONTRIBUTING.md', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod'].includes(f))
    .slice(0, 6);

  const relevantFilesAndFolders =
    relevantDirs.length > 0
      ? relevantDirs.map((entry) => {
          if (entry === 'src/' || entry === 'lib/' || entry === 'app/' || entry === 'packages/') {
            return `${entry} — Core implementation source tree in ${owner}/${repo}`;
          }
          if (entry === 'tests/' || entry === 'test/' || entry === '__tests__/') {
            return `${entry} — Automated test suite to add or update regression coverage`;
          }
          if (entry === 'docs/') {
            return `${entry} — Project documentation and usage guides`;
          }
          return `${entry} — Top-level repository file/directory verified via GitHub Contents API`;
        })
      : [
          `README.md — Project overview and local build commands for ${owner}/${repo}`,
          `src/ — Primary application logic and module definitions`
        ];

  const hasRichDocs = Boolean(repoContext.readmeSnippet || repoContext.contributingSnippet);

  return {
    issueOverview: issueTitle
      ? `Target Issue: "${issueTitle}" in ${owner}/${repo}. ${
          issueSummary ? issueSummary.slice(0, 220) : repoContext.description
        }`
      : `Onboarding guide for contributing to ${owner}/${repo} (${repoContext.language}, default branch: ${repoContext.defaultBranch}).`,
    whatToUnderstandFirst: [
      `Review the problem statement and existing maintainer comments on the issue thread to confirm nobody else has an open PR linked.`,
      `Inspect ${owner}/${repo}'s primary stack (${repoContext.language}${
        repoContext.topics.length > 0 ? ` — topics: ${repoContext.topics.slice(0, 4).join(', ')}` : ''
      }) and default branch (${repoContext.defaultBranch}).`,
      manifest
        ? `Check project manifest details: ${manifest.slice(0, 180)}`
        : `Read the repository README.md for environment variables or local build flags.`
    ],
    relevantFilesAndFolders,
    architectureNotes: `${owner}/${repo} is a ${repoContext.language} repository (${repoContext.stars.toLocaleString()} stars, ${repoContext.license} license). ${
      rootFiles.length > 0
        ? `Top-level layout includes: ${rootFiles.slice(0, 10).join(', ')}.`
        : 'Standard modular open-source repository layout.'
    }`,
    prerequisites,
    setup_commands: setupCommands,
    reproductionWorkflow: [
      `Fork ${owner}/${repo} to your personal GitHub account and clone your fork locally.`,
      `Install dependencies and run the project or test suite once on an unmodified checkout of \`${repoContext.defaultBranch}\` to confirm a clean baseline.`,
      `Locate the module mentioned in the issue description and reproduce the current behavior or missing feature locally.`
    ],
    implementationApproach: [
      `Create a focused feature/fix branch off \`${repoContext.defaultBranch}\`.`,
      `Make the minimal, well-scoped code or documentation change required to resolve the issue without unrelated formatting diffs.`,
      `Add or update unit tests covering the changed behavior.`
    ],
    testingInstructions,
    contribution_rules: [
      repoContext.contributingSnippet
        ? `Follow ${owner}/${repo}'s CONTRIBUTING.md guidelines for commit messages and PR templates.`
        : `Keep pull requests focused on a single issue and reference the issue number (e.g., "Fixes #...") in the PR body.`,
      `Target base branch \`${repoContext.defaultBranch}\` when opening your Pull Request.`,
      `Ensure all automated CI checks pass and respond constructively to maintainer code reviews.`
    ],
    verifiedContextFiles,
    contextConfidence: hasRichDocs ? 'high' : 'partial',
    contextNotice: hasRichDocs
      ? `Generated from verified repository files (${verifiedContextFiles.join(', ')}) in ${owner}/${repo}.`
      : `Generated from repository metadata and root directory listing (${owner}/${repo} does not publish a detailed CONTRIBUTING.md).`
  };
}

/**
 * Generates a structured 12-part AI Onboarding & Contribution Guide using `gemini-3.8-flash`
 * grounded in real repository files (`README.md`, `CONTRIBUTING.md`, `rootFiles`, `manifestSummary`)
 * and the selected issue's description.
 */
export async function generateAISetupAnalysis(
  owner: string,
  repo: string,
  repoContext: LiveRepoContext,
  issueTitle?: string,
  issueSummary?: string,
  issueNumber?: number
): Promise<{ analysis: AISetupAnalysis; isFallback: boolean }> {
  const heuristicBase = buildHeuristicSetupAnalysis(owner, repo, repoContext, issueTitle, issueSummary);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { analysis: heuristicBase, isFallback: true };
  }

  const promptText = `You are a Principal Open-Source Maintainer and Staff Software Engineer onboarding a university computer science student into the GitHub repository "${owner}/${repo}".

Here is the VERIFIED repository context fetched live from GitHub:
- Repository: ${owner}/${repo}
- Primary Language: ${repoContext.language}
- Default Branch: ${repoContext.defaultBranch}
- License: ${repoContext.license}
- Topics: ${repoContext.topics.join(', ') || 'None'}
- Description: ${repoContext.description}
- Verified Root Files/Directories: ${(repoContext.rootFiles || []).join(', ') || 'Not listed'}
- Project Manifest Summary: ${repoContext.manifestSummary || 'No manifest parsed'}

${
  issueTitle
    ? `Selected GitHub Issue ${issueNumber ? `#${issueNumber}` : ''}:
- Issue Title: ${issueTitle}
- Issue Summary: ${issueSummary || 'See issue thread on GitHub'}`
    : 'General repository onboarding request.'
}

--- README.md Excerpt ---
${repoContext.readmeSnippet || 'No README.md excerpt available.'}

--- CONTRIBUTING.md Excerpt ---
${repoContext.contributingSnippet || 'No CONTRIBUTING.md file present.'}

INSTRUCTIONS:
1. Ground every command, prerequisite, and directory reference in the verified repository files above.
2. NEVER invent fake file paths that contradict the Verified Root Files list. If exact sub-files are unknown, reference verified top-level directories (e.g., \`src/\`, \`packages/\`, \`tests/\`) and explain how to search within them.
3. Provide actionable terminal commands in \`setup_commands\` (without leading \`$\` prompts).
4. Explain clearly what the student should understand first, how to reproduce/verify locally, how to implement the fix cleanly, and how to run tests.`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 8000
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issueOverview: {
              type: Type.STRING,
              description: 'Plain-English summary of what this issue or repository contribution entails.'
            },
            whatToUnderstandFirst: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 key concepts, modules, or requirements the student should review before writing code.'
            },
            relevantFilesAndFolders: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 verified files or folders from the repository root tree and their role.'
            },
            architectureNotes: {
              type: Type.STRING,
              description: 'Concise overview of how the repository is structured and built.'
            },
            prerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 required runtime tools, SDKs, or package managers.'
            },
            setup_commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 exact terminal commands to clone, install dependencies, and run tests.'
            },
            reproductionWorkflow: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 concrete steps to reproduce the issue or verify baseline behavior locally.'
            },
            implementationApproach: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 practical engineering steps to implement the solution cleanly.'
            },
            testingInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 instructions for running tests and linters before opening a PR.'
            },
            contribution_rules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 specific pull request, branch, or commit conventions for this repository.'
            }
          },
          required: [
            'issueOverview',
            'whatToUnderstandFirst',
            'relevantFilesAndFolders',
            'architectureNotes',
            'prerequisites',
            'setup_commands',
            'reproductionWorkflow',
            'implementationApproach',
            'testingInstructions',
            'contribution_rules'
          ]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as Partial<AISetupAnalysis>;
      const analysis: AISetupAnalysis = {
        issueOverview: parsed.issueOverview || heuristicBase.issueOverview,
        whatToUnderstandFirst:
          Array.isArray(parsed.whatToUnderstandFirst) && parsed.whatToUnderstandFirst.length > 0
            ? parsed.whatToUnderstandFirst
            : heuristicBase.whatToUnderstandFirst,
        relevantFilesAndFolders:
          Array.isArray(parsed.relevantFilesAndFolders) && parsed.relevantFilesAndFolders.length > 0
            ? parsed.relevantFilesAndFolders
            : heuristicBase.relevantFilesAndFolders,
        architectureNotes: parsed.architectureNotes || heuristicBase.architectureNotes,
        prerequisites:
          Array.isArray(parsed.prerequisites) && parsed.prerequisites.length > 0
            ? parsed.prerequisites
            : heuristicBase.prerequisites,
        setup_commands:
          Array.isArray(parsed.setup_commands) && parsed.setup_commands.length > 0
            ? parsed.setup_commands
            : heuristicBase.setup_commands,
        reproductionWorkflow:
          Array.isArray(parsed.reproductionWorkflow) && parsed.reproductionWorkflow.length > 0
            ? parsed.reproductionWorkflow
            : heuristicBase.reproductionWorkflow,
        implementationApproach:
          Array.isArray(parsed.implementationApproach) && parsed.implementationApproach.length > 0
            ? parsed.implementationApproach
            : heuristicBase.implementationApproach,
        testingInstructions:
          Array.isArray(parsed.testingInstructions) && parsed.testingInstructions.length > 0
            ? parsed.testingInstructions
            : heuristicBase.testingInstructions,
        contribution_rules:
          Array.isArray(parsed.contribution_rules) && parsed.contribution_rules.length > 0
            ? parsed.contribution_rules
            : heuristicBase.contribution_rules,
        verifiedContextFiles: heuristicBase.verifiedContextFiles,
        contextConfidence: heuristicBase.contextConfidence,
        contextNotice: `Synthesized by Gemini 3.8 Flash from verified repository context (${heuristicBase.verifiedContextFiles.join(', ')}).`
      };

      return { analysis, isFallback: false };
    }
  } catch (err) {
    console.warn(`Gemini setup analysis failed for ${owner}/${repo}, using deterministic repository analysis:`, err);
  }

  return { analysis: heuristicBase, isFallback: true };
}

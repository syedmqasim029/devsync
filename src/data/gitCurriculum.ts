export type DiagramType =
  | 'three-states'
  | 'branching'
  | 'fork-workflow'
  | 'git-workflows'
  | 'pr-lifecycle';

export interface GitCommandExample {
  command: string;
  description: string;
}

export interface LessonQuiz {
  type: 'multiple-choice' | 'command-input';
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  acceptedCommands?: string[];
  placeholder?: string;
  hint: string;
  explanation: string;
}

export interface GitLesson {
  id: string;
  number: number;
  levelId: string;
  title: string;
  duration: string;
  summary: string;
  conceptParagraphs: string[];
  keyTakeaways: string[];
  diagramType?: DiagramType;
  commands: GitCommandExample[];
  sandboxCommand: string;
  expectedOutput: string;
  commonPitfall: {
    title: string;
    description: string;
  };
  quiz: LessonQuiz;
}

export interface GitCurriculumLevel {
  id: string;
  number: number;
  title: string;
  badge: string;
  description: string;
  lessons: GitLesson[];
}

export interface FinalAssessmentQuestion {
  id: string;
  levelNumber: number;
  type: 'multiple-choice' | 'command-input';
  question: string;
  scenario?: string;
  options?: string[];
  correctOptionIndex?: number;
  acceptedCommands?: string[];
  placeholder?: string;
  explanation: string;
}

export const GIT_CURRICULUM_LEVELS: GitCurriculumLevel[] = [
  {
    id: 'level-1',
    number: 1,
    title: 'Git Fundamentals',
    badge: 'Beginner',
    description:
      'Master distributed version control concepts, local repository initialization, the three-state architecture, commit hygiene, history inspection, and .gitignore rules.',
    lessons: [
      {
        id: 'lesson-1',
        number: 1,
        levelId: 'level-1',
        title: 'What is Version Control & Why Git?',
        duration: '5 min',
        summary:
          'Understand the history of version control, how snapshots beat file-renaming chaos, and why Distributed VCS (Git) replaced Centralized VCS (SVN).',
        conceptParagraphs: [
          'Version Control Systems (VCS) record changes to files over time so you can recall specific versions later, compare diffs, determine who modified a module, and revert broken code without losing hours of work.',
          'Older Centralized VCS tools (like Subversion or CVS) kept the entire commit history on a single server; if the server went offline, nobody could commit or inspect history. Linus Torvalds created Git in 2005 for Linux kernel development as a Distributed Version Control System (DVCS).',
          'In Git, every developer clones a complete copy of the repository—including every branch and historical commit snapshot—directly onto their machine. Commits, branches, and diffs happen instantaneously offline.'
        ],
        keyTakeaways: [
          'Git stores data as a series of content-addressed snapshots, not just file diffs.',
          'Distributed VCS gives every contributor a full local backup of the project history.',
          'Almost every operation in Git is local, making branching and history inspection sub-millisecond fast.'
        ],
        commands: [
          {
            command: 'git --version',
            description: 'Verify that the Git CLI binary is installed and accessible in your shell PATH.'
          },
          {
            command: 'git help everyday',
            description: 'Display a concise reference of the 20 most essential everyday Git commands.'
          }
        ],
        sandboxCommand: 'git --version',
        expectedOutput: `git version 2.47.0\n✓ Distributed Version Control Engine ready on local host.`,
        commonPitfall: {
          title: 'Confusing Git with GitHub',
          description:
            'Git is the open-source command-line version control tool running locally on your computer. GitHub (along with GitLab and Codeberg) is a cloud hosting platform for Git repositories that adds Pull Requests, Issues, and CI actions.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'What is the primary architectural advantage of a Distributed Version Control System (Git) over a Centralized VCS?',
          options: [
            'Every developer has a complete local copy of the repository and commit history, enabling offline commits and branching',
            'It automatically deploys code to cloud servers on every file save',
            'It prevents two developers from ever editing the same file simultaneously by locking files globally',
            'It requires a constant internet connection to create commits'
          ],
          correctOptionIndex: 0,
          hint: 'Think about where the commit history lives when you clone a Git repository.',
          explanation:
            'In a Distributed VCS like Git, every clone contains the full commit graph and history locally, allowing you to commit, branch, and inspect logs offline.'
        }
      },
      {
        id: 'lesson-2',
        number: 2,
        levelId: 'level-1',
        title: 'Installing Git & Initial Configuration',
        duration: '6 min',
        summary:
          'Configure your author identity, default branch name, and line-ending behavior before creating your first commit.',
        conceptParagraphs: [
          'Every Git commit permanently bakes in the author’s name and email address. Before making your first commit, you must configure user.name and user.email using git config --global so open-source maintainers and GitHub can attribute your contributions to your account.',
          'Git stores configuration at three scopes: --system (all users on the machine), --global (~/.gitconfig for your user account), and --local (.git/config inside a single repository, overriding global settings—useful when separating university/personal emails from work emails).',
          'Modern repositories standardize on main as the default initial branch name via init.defaultBranch.'
        ],
        keyTakeaways: [
          'Always match your git config user.email with your verified GitHub account email so commits link to your profile graph.',
          'Use --global to set defaults across all repositories on your laptop, and --local for project-specific overrides.',
          'Verify your active settings at any time with git config --list.'
        ],
        commands: [
          {
            command: 'git config --global user.name "Alex Rivera"',
            description: 'Set your display name for all commits across your machine.'
          },
          {
            command: 'git config --global user.email "alex.rivera@university.edu"',
            description: 'Set your verified GitHub email address for commit attribution.'
          },
          {
            command: 'git config --global init.defaultBranch main',
            description: 'Configure new repositories to use "main" as the default branch.'
          },
          {
            command: 'git config --list',
            description: 'Inspect all active Git configuration keys and values.'
          }
        ],
        sandboxCommand: 'git config --global user.name "Alex Rivera"',
        expectedOutput: `Updated ~/.gitconfig:\nuser.name=Alex Rivera\nuser.email=alex.rivera@university.edu\ninit.defaultBranch=main\n✓ Global contributor identity configured!`,
        commonPitfall: {
          title: 'Misconfigured Email Breaking Your GitHub Contribution Graph',
          description:
            'If your local user.email does not match an email address verified in your GitHub Settings → Emails, your commits will still appear in the repository log, but GitHub will not link them to your profile or green contribution squares.'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to view all active Git configuration settings (`git config --list`):',
          acceptedCommands: [
            'git config --list',
            'git config -l',
            'git config --global --list'
          ],
          placeholder: 'git config ...',
          hint: 'Use git config with the --list (or -l) flag.',
          explanation:
            '`git config --list` prints all configuration keys loaded from system, global, and local config files.'
        }
      },
      {
        id: 'lesson-3',
        number: 3,
        levelId: 'level-1',
        title: 'Creating a Repository (git init vs git clone)',
        duration: '6 min',
        summary:
          'Learn the two ways to start working with Git: initializing a brand-new project locally or cloning an existing remote repository.',
        conceptParagraphs: [
          'There are two ways to obtain a Git repository on your machine. When starting a brand-new project from scratch, you navigate into your project folder and run git init. This creates a hidden .git subdirectory containing the object database, refs, and HEAD pointer.',
          'When contributing to an existing open-source project, you never run git init. Instead, you run git clone <url>, which downloads the entire repository history from GitHub, sets up a remote named origin, and checks out the default branch into a working directory.'
        ],
        keyTakeaways: [
          'git init turns an existing local directory into a brand-new Git repository.',
          'git clone copies an existing remote repository along with its full commit history and remote tracking.',
          'All repository metadata and commit objects live inside the hidden .git/ directory.'
        ],
        commands: [
          {
            command: 'git init',
            description: 'Initialize a new empty Git repository in the current directory.'
          },
          {
            command: 'git clone https://github.com/vercel/next.js.git',
            description: 'Clone an existing remote repository into a new folder.'
          }
        ],
        sandboxCommand: 'git init my-open-source-lib',
        expectedOutput: `Initialized empty Git repository in /home/student/my-open-source-lib/.git/\nCreated .git/objects, .git/refs/heads, and .git/HEAD -> refs/heads/main`,
        commonPitfall: {
          title: 'Running git init Inside an Already-Cloned Repository',
          description:
            'Never initialize a new Git repo inside another Git repo (nested .git folders) unless intentionally configuring submodules. Check `git status` first to see if you are already inside a tracked directory.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'You want to start working on an existing open-source repository hosted on GitHub. Which command should you run?',
          options: [
            'git clone <repository-url>',
            'git init <repository-url>',
            'git pull --new',
            'git checkout --remote'
          ],
          correctOptionIndex: 0,
          hint: 'Which command downloads a remote repository and automatically configures `origin`?',
          explanation:
            '`git clone <url>` downloads the full repository history, creates the project folder, and links the `origin` remote automatically.'
        }
      },
      {
        id: 'lesson-4',
        number: 4,
        levelId: 'level-1',
        title: 'The Three States: Working Directory, Staging Area & Repository',
        duration: '8 min',
        summary:
          'Visualize how files move from untracked edits in your Working Directory, to the Staging Area (Index), and permanently into the .git Repository.',
        conceptParagraphs: [
          'Understanding Git’s Three States is the single most important mental model for mastering Git. Every file in your project resides in one of three states: Modified (in the Working Directory), Staged (in the Staging Area / Index), or Committed (stored safely in the .git Repository database).',
          '1. Working Directory: The actual files and folders you edit in VS Code. Changes here are not yet recorded in a commit.',
          '2. Staging Area (Index): A draft zone (.git/index) that holds the exact changes you plan to include in your next commit. Running git add moves changes from the Working Directory into the Staging Area, letting you craft atomic commits even if you edited 10 different files.',
          '3. Repository (.git directory): Where Git permanently stores committed snapshots as immutable SHA-256 / SHA-1 commit objects.'
        ],
        keyTakeaways: [
          'Working Directory → (git add) → Staging Area → (git commit) → Repository (.git).',
          'The Staging Area lets you group related edits into clean, single-purpose commits.',
          'git checkout / git restore moves committed snapshots back into your Working Directory.'
        ],
        diagramType: 'three-states',
        commands: [
          {
            command: 'git status -s',
            description: 'View a compact two-column summary of Working Directory vs Staging Area changes.'
          },
          {
            command: 'git diff',
            description: 'Compare unstaged Working Directory edits against the Staging Area.'
          },
          {
            command: 'git diff --staged',
            description: 'Inspect the exact changes currently staged for the next commit.'
          }
        ],
        sandboxCommand: 'git diff --staged',
        expectedOutput: `diff --git a/src/utils/parser.ts b/src/utils/parser.ts\nindex 3a91c01..8f12e44 100644\n--- a/src/utils/parser.ts\n+++ b/src/utils/parser.ts\n@@ -14,6 +14,8 @@ export function parseConfig(raw: string) {\n+  if (!raw.trim()) return {};\n   return JSON.parse(raw);\n }`,
        commonPitfall: {
          title: 'Editing a File After Running git add Without Re-Staging It',
          description:
            'Git stages the exact snapshot of the file at the moment you run `git add`. If you save further edits to that file in your editor before running `git commit`, those newer edits remain unstaged unless you run `git add` again!'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which Git command inspects the changes that are currently in the Staging Area waiting to be committed?',
          options: [
            'git diff --staged',
            'git status --remote',
            'git log --stat',
            'git init --check'
          ],
          correctOptionIndex: 0,
          hint: 'Plain `git diff` shows unstaged changes; what flag shows staged changes?',
          explanation:
            '`git diff --staged` (or `git diff --cached`) compares the Staging Area against your last commit.'
        }
      },
      {
        id: 'lesson-5',
        number: 5,
        levelId: 'level-1',
        title: 'Basic Workflow: git status, git add, git commit',
        duration: '7 min',
        summary:
          'Practice the core daily heartbeat of software engineering: inspecting file state, staging changes selectively, and recording a commit.',
        conceptParagraphs: [
          'Your everyday loop in Git revolves around three commands: git status, git add, and git commit. Before doing anything, run git status to see which branch you are on, which files have been modified, and which files are untracked.',
          'Use git add <file> (or git add -p for interactive hunk-by-hunk staging) to stage only the changes that belong together. Finally, run git commit -m "<message>" to seal the staged snapshot into your branch history.'
        ],
        keyTakeaways: [
          'Prefer `git add <specific-file>` or `git add -p` over blind `git add .` to avoid staging debug logs or stray files.',
          '`git status` tells you both current file states and the exact command to unstage or discard changes.',
          'Each commit creates an immutable cryptographic hash (SHA) representing the entire project tree.'
        ],
        commands: [
          {
            command: 'git status',
            description: 'Inspect untracked, modified, and staged files in your working tree.'
          },
          {
            command: 'git add src/components/Button.tsx',
            description: 'Stage a specific modified file into the Staging Area.'
          },
          {
            command: 'git commit -m "feat(ui): add accessible aria-label to icon button"',
            description: 'Record the staged snapshot permanently into the local repository.'
          }
        ],
        sandboxCommand: 'git add src/components/Button.tsx && git commit -m "feat(ui): add accessible aria-label to icon button"',
        expectedOutput: `[main 4b825dc] feat(ui): add accessible aria-label to icon button\n 1 file changed, 4 insertions(+), 1 deletion(-)\n✓ Staged snapshot committed to local history.`,
        commonPitfall: {
          title: 'Using `git add .` Without Checking `git status` First',
          description:
            'Running `git add .` recursively stages every untracked file in your directory—frequently catching temporary test scripts, `.DS_Store`, or local config overrides. Always run `git status` before staging.'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to check which files are modified, staged, or untracked in your working directory:',
          acceptedCommands: ['git status', 'git status -s', 'git status --short'],
          placeholder: 'git ...',
          hint: 'It is the most frequently run inspection command in Git.',
          explanation:
            '`git status` displays the current branch, tracking status, staged changes, unstaged modifications, and untracked files.'
        }
      },
      {
        id: 'lesson-6',
        number: 6,
        levelId: 'level-1',
        title: 'Writing Good Commit Messages',
        duration: '6 min',
        summary:
          'Learn the Conventional Commits specification, imperative mood phrasing, and why maintainers reject "fixed stuff" commit logs.',
        conceptParagraphs: [
          'In open-source projects, your commit messages serve as permanent architectural documentation for future contributors running git blame or bisecting a regression years later. Vague messages like "fix bug", "wip", or "updates" make history impossible to navigate.',
          'Most major repositories follow the Conventional Commits specification: <type>(<scope>): <subject>. Common types include feat (new feature), fix (bug fix), docs (documentation), refactor, test, and chore.',
          'Write the subject line in the imperative mood ("add keyboard shortcut", not "added keyboard shortcut" or "adds keyboard shortcut"), keep it under 50–72 characters, and explain WHY the change was needed in the commit body if non-obvious.'
        ],
        keyTakeaways: [
          'Mental test for imperative mood: Your subject should complete the sentence "If applied, this commit will <your subject>".',
          'Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`) allow automated changelog and semantic version tools to work.',
          'Bad: `git commit -m "fixed stuff"` → Good: `git commit -m "fix(auth): prevent crash when OAuth cookie expires"`.'
        ],
        commands: [
          {
            command: 'git commit -m "fix(parser): handle empty JSON payload without throwing"',
            description: 'Commit with a clear Conventional Commits prefix, scope, and imperative summary.'
          },
          {
            command: 'git commit -m "docs(readme): add Windows WSL2 installation prerequisites"',
            description: 'Document a documentation-only improvement.'
          }
        ],
        sandboxCommand: 'git commit -m "fix(parser): handle empty JSON payload without throwing"',
        expectedOutput: `[fix/empty-json 92e1a4c] fix(parser): handle empty JSON payload without throwing\n 1 file changed, 7 insertions(+), 2 deletions(-)\n✓ Commit message passes Conventional Commits lint check!`,
        commonPitfall: {
          title: 'Writing Past-Tense or Vague Commit Messages',
          description:
            'Many repositories run `commitlint` in CI. A commit titled `"Fixed bug"` or `"updated files"` will fail automated Pull Request checks before a human maintainer even reviews your code.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which of the following commit messages follows open-source best practices (Conventional Commits + imperative mood)?',
          options: [
            'fix(navbar): prevent mobile menu overflow on 375px viewports',
            'Fixed the mobile navbar bug yesterday',
            'updates and bug fixes to navbar.tsx',
            'WIP working on responsive styles'
          ],
          correctOptionIndex: 0,
          hint: 'Look for `<type>(<scope>): <imperative verb>...` describing what the commit does.',
          explanation:
            '`fix(navbar): prevent mobile menu overflow on 375px viewports` uses the `fix(scope):` convention and imperative verb `prevent`.'
        }
      },
      {
        id: 'lesson-7',
        number: 7,
        levelId: 'level-1',
        title: 'Viewing History: git log, git log --oneline, git show',
        duration: '6 min',
        summary:
          'Navigate repository history, visualize branch graphs in the terminal, and inspect individual commit diffs.',
        conceptParagraphs: [
          'Before modifying an unfamiliar file in an open-source codebase, experienced contributors inspect its recent history using git log. By default, git log prints each commit’s full 40-character SHA hash, author, timestamp, and commit message in reverse chronological order.',
          'Adding flags transforms git log into a powerful visual debugger: git log --oneline --graph --decorate condenses each commit into a single line with an ASCII branch diagram, while git show <commit-sha> displays the exact metadata and line-by-line patch introduced by a specific commit.'
        ],
        keyTakeaways: [
          '`git log --oneline -n 10` gives a scannable overview of the 10 most recent commits.',
          '`git log --oneline --graph --all` renders a visual ASCII branch and merge tree right in your terminal.',
          '`git show <sha>` inspects the exact diff of any commit in history.'
        ],
        commands: [
          {
            command: 'git log --oneline -n 5',
            description: 'Show the last 5 commits in compact single-line format.'
          },
          {
            command: 'git log --oneline --graph --decorate',
            description: 'Render a visual ASCII commit graph showing branches and merges.'
          },
          {
            command: 'git show 92e1a4c',
            description: 'Inspect the commit message, metadata, and exact code diff for commit 92e1a4c.'
          }
        ],
        sandboxCommand: 'git log --oneline --graph -n 4',
        expectedOutput: `* 92e1a4c (HEAD -> main) fix(parser): handle empty JSON payload without throwing\n* 4b825dc feat(ui): add accessible aria-label to icon button\n* 7c31b09 docs(contributing): clarify local test runner setup\n* 1a09f22 chore: initial repository bootstrap`,
        commonPitfall: {
          title: 'Getting Trapped in the Terminal Pager (`less`)',
          description:
            'When `git log` output is longer than your terminal height, Git opens it inside the `less` pager (showing a `:` prompt at the bottom). Press `q` on your keyboard to quit the pager and return to your shell prompt!'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to view the commit history condensed into one line per commit (`git log --oneline`):',
          acceptedCommands: [
            'git log --oneline',
            'git log --oneline --graph',
            'git log --oneline -n 5'
          ],
          placeholder: 'git log ...',
          hint: 'Pass the `--oneline` flag to `git log`.',
          explanation:
            '`git log --oneline` abbreviates commit SHAs to 7 characters and displays each commit subject on a single line.'
        }
      },
      {
        id: 'lesson-8',
        number: 8,
        levelId: 'level-1',
        title: '.gitignore Files (What to Ignore & Common Patterns)',
        duration: '6 min',
        summary:
          'Keep build artifacts, node_modules, virtual environments, and secret .env credentials out of version control.',
        conceptParagraphs: [
          'Not every file in your workspace belongs in Git. Installed dependency folders (node_modules/, .venv/), compiled build outputs (dist/, build/, *.pyc), OS metadata (.DS_Store, Thumbs.db), and secret environment variables (.env) should never be committed.',
          'Placing a .gitignore file in the root of your repository instructs Git to ignore matching glob patterns so they never clutter git status or get accidentally staged.',
          'Note that .gitignore only prevents UNTRACKED files from being staged. If a file was already committed before adding it to .gitignore, you must untrack it using git rm --cached <file>.'
        ],
        keyTakeaways: [
          'Always ignore dependencies (`node_modules/`, `__pycache__/`), build outputs (`dist/`), and secrets (`.env*`, except `.env.example`).',
          'Use `#` for comments, `/` at the end for directories (`dist/`), and `!` to negate a pattern (`!.env.example`).',
          'If a file is already tracked, remove it from Git’s index without deleting it from disk via `git rm --cached <file>`.'
        ],
        commands: [
          {
            command: 'git check-ignore -v .env',
            description: 'Verify which line in .gitignore is causing a specific file to be ignored.'
          },
          {
            command: 'git rm --cached .env',
            description: 'Stop tracking a previously committed file while keeping it on your local disk.'
          }
        ],
        sandboxCommand: 'git check-ignore -v .env',
        expectedOutput: `.gitignore:4:.env\t.env\n✓ Verified: .env is protected by rule on line 4 of .gitignore and will not be staged.`,
        commonPitfall: {
          title: 'Adding `.env` to `.gitignore` AFTER Committing It',
          description:
            'Adding `.env` to `.gitignore` does NOT remove a file that was already committed in an earlier commit! And even if you delete it in a later commit, the secret remains visible in the commit history (`git log -p`). Always configure `.gitignore` before your first commit.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'You accidentally committed a local `config.local.json` file, then added `config.local.json` to `.gitignore`, but Git still tracks changes to it. How do you stop Git from tracking it without deleting the file from your computer?',
          options: [
            'git rm --cached config.local.json',
            'git delete --local config.local.json',
            'git ignore --force config.local.json',
            'rm -rf .git'
          ],
          correctOptionIndex: 0,
          hint: 'Which flag tells `git rm` to only remove the file from the Staging Index (`--cached`) and keep the working copy?',
          explanation:
            '`git rm --cached <file>` removes the file from Git tracking while preserving your local file on disk.'
        }
      }
    ]
  },
  {
    id: 'level-2',
    number: 2,
    title: 'Branching & Merging',
    badge: 'Intermediate',
    description:
      'Isolate feature work with branches, understand fast-forward vs 3-way merges, resolve merge conflicts cleanly, rebase commit histories, stash work-in-progress, and safely undo mistakes.',
    lessons: [
      {
        id: 'lesson-9',
        number: 9,
        levelId: 'level-2',
        title: 'Understanding Branches (What They Are & Why They Matter)',
        duration: '7 min',
        summary:
          'Discover why Git branches are lightweight 41-byte pointers to commits and how HEAD tracks your active branch.',
        conceptParagraphs: [
          'In older version control systems, creating a branch meant copying every source file into a separate directory—an expensive operation that took minutes. In Git, a branch is simply a lightweight, movable pointer (a 41-byte file containing a 40-character commit SHA) pointing to a commit.',
          'Because a branch is just a pointer, creating 50 branches in Git takes less than a millisecond and uses virtually zero disk space.',
          'Git knows which branch you are currently working on by maintaining a special pointer called HEAD. When you make a new commit, the branch pointer that HEAD points to automatically advances forward to the new commit.'
        ],
        keyTakeaways: [
          'A branch in Git is just a movable pointer to a specific commit snapshot.',
          '`HEAD` points to your currently checked-out branch.',
          'Never develop directly on `main` when contributing to open source; always isolate each issue in its own topic branch.'
        ],
        diagramType: 'branching',
        commands: [
          {
            command: 'git branch -a',
            description: 'List all local branches and remote-tracking branches.'
          },
          {
            command: 'git log --oneline --decorate -n 3',
            description: 'Inspect where HEAD, main, and feature branch pointers sit in the commit graph.'
          }
        ],
        sandboxCommand: 'git branch -a',
        expectedOutput: `* main\n  remotes/origin/HEAD -> origin/main\n  remotes/origin/main\n✓ Active pointer HEAD -> main`,
        commonPitfall: {
          title: 'Making Multiple Unrelated Fixes on the Same Branch',
          description:
            'If you fix two separate issues on the same branch (especially `main`), both changes get bundled into a single Pull Request. Maintainers will ask you to split them. Always create one branch per issue.'
        },
        quiz: {
          type: 'multiple-choice',
          question: 'What is a branch under the hood in Git, and how does Git know which branch is currently active?',
          options: [
            'A branch is a lightweight movable pointer to a commit, and the special pointer HEAD points to the active branch',
            'A branch is a full duplicate copy of all project files stored in a separate .branches folder',
            'A branch is a cloud-only setting stored exclusively on GitHub servers',
            'A branch is a compressed zip archive created every time you run git status'
          ],
          correctOptionIndex: 0,
          hint: 'Remember the 41-byte pointer model and the role of `HEAD`.',
          explanation:
            'Git branches are lightweight pointers to commits in the DAG (Directed Acyclic Graph), and `HEAD` references the currently checked-out branch.'
        }
      },
      {
        id: 'lesson-10',
        number: 10,
        levelId: 'level-2',
        title: 'Creating & Switching Branches: git branch, git switch, git checkout -b',
        duration: '7 min',
        summary:
          'Create descriptive feature/fix branches and switch between contexts using both classic git checkout -b and modern git switch -c.',
        conceptParagraphs: [
          'To start working on an open-source issue, you create a new branch off the latest main branch and switch to it. Historically, git checkout -b <branch-name> was the universal command to both create and switch to a new branch.',
          'Because git checkout was overloaded (used for both switching branches and discarding file edits), Git 2.23 introduced git switch specifically for branch navigation: git switch -c <branch-name> creates and switches to a new branch, while git switch main returns to main.',
          'Use clear, descriptive branch names prefixed with the change type, such as fix/issue-142-null-check or feat/keyboard-shortcuts.'
        ],
        keyTakeaways: [
          '`git switch -c <branch>` and `git checkout -b <branch>` are equivalent: both create a new branch and switch `HEAD` to it.',
          '`git switch -` quickly toggles back to whichever branch you were on previously.',
          'Delete merged local branches cleanly with `git branch -d <branch>`.'
        ],
        commands: [
          {
            command: 'git switch -c fix/issue-104-dropdown-escape',
            description: 'Create and immediately switch to a new branch using modern Git syntax.'
          },
          {
            command: 'git checkout -b fix/issue-104-dropdown-escape',
            description: 'Classic syntax to create and switch to a new branch in one step.'
          },
          {
            command: 'git branch -d fix/issue-104-dropdown-escape',
            description: 'Safely delete a local branch after it has been merged.'
          }
        ],
        sandboxCommand: 'git switch -c fix/issue-104-dropdown-escape',
        expectedOutput: `Switched to a new branch 'fix/issue-104-dropdown-escape'\n✓ HEAD now points to isolated branch fix/issue-104-dropdown-escape.`,
        commonPitfall: {
          title: 'Branching Off an Old Feature Branch Instead of `main`',
          description:
            'Before creating a second feature branch for a new issue, always run `git switch main` first! If you run `git checkout -b fix/issue-2` while still on `fix/issue-1`, your new branch will include all the commits from `fix/issue-1`.'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to create and switch to a new branch named `fix/login-bug` (either `git switch -c` or `git checkout -b`):',
          acceptedCommands: [
            'git checkout -b fix/login-bug',
            'git switch -c fix/login-bug'
          ],
          placeholder: 'git switch -c fix/login-bug',
          hint: 'Use `git switch -c fix/login-bug` or `git checkout -b fix/login-bug`.',
          explanation:
            'Both `git switch -c fix/login-bug` and `git checkout -b fix/login-bug` create the branch and move `HEAD` to it immediately.'
        }
      },
      {
        id: 'lesson-11',
        number: 11,
        levelId: 'level-2',
        title: 'Merging Branches: Fast-Forward vs 3-Way Merge',
        duration: '7 min',
        summary:
          'Understand how Git combines diverged branch histories using Fast-Forward pointer shifts or 3-Way Merge commits.',
        conceptParagraphs: [
          'Once work on a feature branch is complete, git merge integrates those commits into the target branch (such as main). First, switch to the receiving branch (git switch main), then run git merge <feature-branch>.',
          'Scenario A — Fast-Forward Merge: If main has not received any new commits since you branched off it, Git simply slides the main pointer forward to match your feature branch commit. No extra merge commit is created.',
          'Scenario B — 3-Way Merge: If both main and your feature branch have new commits (their histories diverged), Git performs a 3-way merge using three snapshots: the common ancestor commit, the tip of main, and the tip of your feature branch, creating a new Merge Commit with two parents.'
        ],
        keyTakeaways: [
          'Always switch to the receiving branch (`git switch main`) before running `git merge <feature>`.',
          'Fast-Forward merges occur when the target branch has not diverged.',
          '3-Way merges combine diverged histories by comparing both branch tips against their common base ancestor.'
        ],
        commands: [
          {
            command: 'git switch main && git merge fix/issue-104-dropdown-escape',
            description: 'Switch to main and merge the completed feature branch.'
          },
          {
            command: 'git merge --no-ff feat/search-filter',
            description: 'Force a merge commit even if a fast-forward merge is possible.'
          }
        ],
        sandboxCommand: 'git merge fix/issue-104-dropdown-escape',
        expectedOutput: `Updating 92e1a4c..e41d90a\nFast-forward\n src/components/Dropdown.tsx | 12 ++++++++++--\n 1 file changed, 10 insertions(+), 2 deletions(-)\n✓ Branch merged cleanly via Fast-Forward!`,
        commonPitfall: {
          title: 'Running `git merge` From the Wrong Active Branch',
          description:
            '`git merge <branch>` always merges `<branch>` INTO your currently checked-out branch (`HEAD`). Always verify `git status` or `git branch` first so you merge in the intended direction.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'When does Git perform a 3-Way Merge (creating a new merge commit with two parents) instead of a Fast-Forward merge?',
          options: [
            'When the target branch (e.g., main) has received new commits since the feature branch was created, causing the two branches to diverge',
            'Whenever a branch name contains more than 3 words',
            'Only when there are at least 3 developers working on the repository',
            'Whenever you run git status before merging'
          ],
          correctOptionIndex: 0,
          hint: 'Why can’t Git simply slide the `main` pointer forward if `main` also has new commits?',
          explanation:
            'When both branches have progressed independently from their common ancestor, Git must reconcile three commits (common ancestor + both branch tips) into a 3-way merge commit.'
        }
      },
      {
        id: 'lesson-12',
        number: 12,
        levelId: 'level-2',
        title: 'Merge Conflicts — How to Identify, Read, and Resolve Them',
        duration: '9 min',
        summary:
          'Demystify merge conflict markers (<<<<<<< HEAD, =======, >>>>>>>) and walk through resolving a conflict step by step.',
        conceptParagraphs: [
          'A merge conflict happens when two branches modify the exact same lines in the same file (or when one branch deletes a file another branch modified). Git pauses the merge and asks you to decide which code to keep.',
          'Inside the conflicted file, Git inserts conflict markers:\n<<<<<<< HEAD\nconst TIMEOUT_MS = 5000;\n=======\nconst TIMEOUT_MS = 10000;\n>>>>>>> feat/configurable-timeout',
          'Everything between <<<<<<< HEAD and ======= is what exists on your current branch. Everything between ======= and >>>>>>> is the incoming change from the branch being merged. To resolve the conflict: (1) Edit the file to keep the desired code and delete all three marker lines (`<<<<<<<`, `=======`, `>>>>>>>`), (2) Stage the resolved file with `git add <file>`, and (3) Complete the merge with `git commit`.'
        ],
        keyTakeaways: [
          'Conflict markers are plain text inserted by Git: `<<<<<<< HEAD` (current branch), `=======` (divider), `>>>>>>> branch` (incoming branch).',
          'You MUST delete the `<<<<<<<`, `=======`, and `>>>>>>>` marker lines themselves after choosing/combining the code.',
          'Run `git add <resolved-file>` to mark a conflicted file as resolved, or `git merge --abort` to cancel safely.'
        ],
        commands: [
          {
            command: 'git status',
            description: 'See which files are currently marked as "both modified" (unmerged).'
          },
          {
            command: 'git add src/config/timeout.ts && git commit -m "merge: resolve timeout constant conflict"',
            description: 'Stage the cleaned file after removing conflict markers and finalize the merge.'
          },
          {
            command: 'git merge --abort',
            description: 'Abort the merge and restore your working directory to its pre-merge state.'
          }
        ],
        sandboxCommand: 'git add src/config/timeout.ts && git commit -m "merge: resolve timeout constant conflict"',
        expectedOutput: `[main 77d31f0] merge: resolve timeout constant conflict\n✓ All conflict markers removed and 3-way merge committed cleanly!`,
        commonPitfall: {
          title: 'Committing Leftover `<<<<<<< HEAD` Markers Into the Codebase',
          description:
            'Always search your project for `<<<<<<<` and run the test suite (`npm test` / `npm run build`) before committing a conflict resolution so syntax-breaking markers never reach your Pull Request.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'After manually editing a conflicted file and removing the `<<<<<<<`, `=======`, and `>>>>>>>` markers, what is the next command to tell Git the conflict in that file is resolved?',
          options: [
            'git add <file>',
            'git resolve --force <file>',
            'git conflict --clear',
            'git branch -f'
          ],
          correctOptionIndex: 0,
          hint: 'Staging a conflicted file tells Git that you have finished resolving it.',
          explanation:
            'Staging the file with `git add <file>` marks the conflict as resolved in Git’s index so you can finalize with `git commit`.'
        }
      },
      {
        id: 'lesson-13',
        number: 13,
        levelId: 'level-2',
        title: 'Rebasing: git rebase & Interactive Rebase Basics',
        duration: '8 min',
        summary:
          'Keep your feature branch history linear by replaying commits onto the latest main branch, and squash WIP commits with git rebase -i.',
        conceptParagraphs: [
          'While git merge combines two branches by creating a merge commit, git rebase takes the commits from your feature branch and replays them one by one on top of the latest tip of main, producing a completely linear commit history.',
          'Many open-source projects ask contributors to run git rebase main (or git pull --rebase upstream main) so the Pull Request applies cleanly onto the latest codebase without noisy merge commits.',
          'Interactive rebase (git rebase -i HEAD~3) lets you clean up your own local commits before opening a PR—allowing you to squash multiple "fix typo" or "WIP" commits into a single polished commit, or reword commit messages.'
        ],
        keyTakeaways: [
          '`git rebase main` replays your current feature branch commits on top of `main` with new commit SHAs.',
          '`git rebase -i HEAD~N` lets you `squash`, `fixup`, or `reword` your last N local commits before review.',
          'Golden Rule of Rebasing: Never rebase a shared public branch (like `main`) that other developers are basing work on.'
        ],
        commands: [
          {
            command: 'git rebase main',
            description: 'Replay your current feature branch commits onto the tip of main.'
          },
          {
            command: 'git rebase -i HEAD~3',
            description: 'Interactively squash, reorder, or reword your last 3 commits.'
          },
          {
            command: 'git rebase --abort',
            description: 'Cancel an in-progress rebase and return your branch to its original state.'
          }
        ],
        sandboxCommand: 'git rebase main',
        expectedOutput: `Successfully rebased and updated refs/heads/fix/issue-104-dropdown-escape.\n✓ 2 feature commits replayed linearly on top of latest main!`,
        commonPitfall: {
          title: 'Violating the Golden Rule of Rebasing on Shared Branches',
          description:
            'Rebasing rewrites commit SHAs. Rebasing your own private feature branch is safe and encouraged, but never rebase `main` or a branch multiple teammates are actively pushing to.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'You made 4 messy "WIP" and "fix typo" commits on your local feature branch and want to combine them into 1 clean commit before opening a Pull Request. Which command should you use?',
          options: [
            'git rebase -i HEAD~4',
            'git merge --squash-all main',
            'git clone --clean',
            'git init --reword'
          ],
          correctOptionIndex: 0,
          hint: 'Which interactive command lets you `squash` or `fixup` the last N commits?',
          explanation:
            '`git rebase -i HEAD~4` opens interactive rebase for the last 4 commits so you can squash them into a single clean commit.'
        }
      },
      {
        id: 'lesson-14',
        number: 14,
        levelId: 'level-2',
        title: 'Stashing Changes: git stash & git stash pop',
        duration: '6 min',
        summary:
          'Temporarily shelve uncommitted work-in-progress when you need to switch branches urgently without committing half-finished code.',
        conceptParagraphs: [
          'Imagine you are halfway through refactoring a component when you need to switch to main to test a bug report or pull upstream updates. Your code doesn’t compile yet, so you don’t want to make a commit—and Git won’t let you switch branches if uncommitted changes conflict.',
          'Running git stash takes your modified tracked files and staged changes, saves them onto a local stack of unfinished work, and reverts your working directory back to a clean HEAD state.',
          'When you return to your branch, git stash pop reapplies those saved changes and removes them from the stash stack (whereas git stash apply reapplies them while keeping a copy in the stash list).'
        ],
        keyTakeaways: [
          '`git stash push -m "description"` shelves uncommitted changes with a helpful label.',
          'Use `git stash -u` (`--include-untracked`) if you also created brand-new untracked files you want stashed.',
          '`git stash pop` restores the most recent stash and removes it from `git stash list`.'
        ],
        commands: [
          {
            command: 'git stash push -m "wip: responsive navbar layout"',
            description: 'Save current uncommitted modifications to the stash stack with a label.'
          },
          {
            command: 'git stash list',
            description: 'View all stashed work snapshots currently stored on your stack.'
          },
          {
            command: 'git stash pop',
            description: 'Restore the latest stashed changes to your working tree and drop the stash entry.'
          }
        ],
        sandboxCommand: 'git stash push -m "wip: responsive navbar layout"',
        expectedOutput: `Saved working directory and index state On fix/navbar: wip: responsive navbar layout\nHEAD is now at 92e1a4c fix(parser): handle empty JSON payload\n✓ Working tree is clean; you can now switch branches freely.`,
        commonPitfall: {
          title: 'Forgetting That Plain `git stash` Ignores Untracked Files',
          description:
            'By default, `git stash` only shelves modifications to files Git is already tracking. If you created a new file that has never been staged, pass `-u` (`git stash -u`) so the new file is stashed too.'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to restore the most recently stashed changes and remove them from the stash stack:',
          acceptedCommands: ['git stash pop'],
          placeholder: 'git stash ...',
          hint: 'Think of stack operations: push and ...',
          explanation:
            '`git stash pop` applies the top stash (`stash@{0}`) to your working directory and drops it from the stash list.'
        }
      },
      {
        id: 'lesson-15',
        number: 15,
        levelId: 'level-2',
        title: 'Undoing Things: git reset, git revert, git restore & --amend',
        duration: '8 min',
        summary:
          'Choose the right undo tool for every situation: fixing your last commit message, unstaging files, resetting local commits, or safely reverting public commits.',
        conceptParagraphs: [
          'Git offers distinct undo tools depending on whether your changes are unstaged, staged, committed locally, or already pushed to a shared remote:',
          '• Fix the very last commit (message or forgotten file): Run git commit --amend -m "new message".',
          '• Undo local commits (`git reset`): Moves the current branch pointer backward. --soft keeps changes staged; --mixed (default) keeps changes in your working directory unstaged; --hard permanently destroys both the commits and uncommitted working tree edits.',
          '• Undo a commit already pushed to a shared branch (`git revert <sha>`): Instead of rewriting history, git revert creates a brand-new commit that applies the exact inverse diff of the target commit—making it 100% safe for shared branches.'
        ],
        keyTakeaways: [
          '`git commit --amend` updates your most recent local commit without creating a second commit.',
          '`git reset --soft HEAD~1` undoes the last commit while keeping all your code edits neatly staged.',
          '`git revert <sha>` is the safe way to undo a commit on a shared branch because it does not rewrite history.'
        ],
        commands: [
          {
            command: 'git commit --amend -m "fix(auth): validate CSRF state token on callback"',
            description: 'Replace the most recent commit message (or fold in newly staged files).'
          },
          {
            command: 'git reset --soft HEAD~1',
            description: 'Undo the last local commit but keep all its changes staged in the Index.'
          },
          {
            command: 'git revert 4b825dc',
            description: 'Create a new commit that safely reverses the changes introduced by commit 4b825dc.'
          }
        ],
        sandboxCommand: 'git reset --soft HEAD~1',
        expectedOutput: `Moved HEAD back 1 commit to 4b825dc.\nStaged changes preserved in Index:\n  modified:   src/utils/parser.ts\n✓ Ready to edit or re-commit without losing work!`,
        commonPitfall: {
          title: 'Running `git reset --hard` When You Have Uncommitted Work',
          description:
            '`git reset --hard` wipes out uncommitted modifications in your working directory without putting them in the trash. Always use `git stash` or `git reset --soft` unless you are 100% certain you want to discard local edits.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'A commit with a bug was already merged and pushed to the shared `main` branch. Which command safely undoes that commit without rewriting shared history?',
          options: [
            'git revert <commit-sha>',
            'git reset --hard HEAD~1',
            'git rebase -i main',
            'git stash drop'
          ],
          correctOptionIndex: 0,
          hint: 'Which command creates a new inverse commit rather than deleting history?',
          explanation:
            '`git revert <commit-sha>` generates a new commit that inverses the changes of the specified commit, preserving shared history safely.'
        }
      }
    ]
  },
  {
    id: 'level-3',
    number: 3,
    title: 'Working with Remotes & GitHub',
    badge: 'Intermediate–Advanced',
    description:
      'Connect local repositories to GitHub remotes, master the open-source Fork & Upstream triangle workflow, synchronize forks, open Pull Requests, address code reviews, and link Issues.',
    lessons: [
      {
        id: 'lesson-16',
        number: 16,
        levelId: 'level-3',
        title: 'Remotes Explained: origin vs upstream',
        duration: '7 min',
        summary:
          'Understand how Git bookmarks remote repository URLs and why open-source contributors configure both origin (your fork) and upstream (the official repo).',
        conceptParagraphs: [
          'A remote in Git is simply a named bookmark pointing to a repository URL hosted on GitHub or another server. When you clone a repository, Git automatically names that source URL origin.',
          'In open-source development, you do not have permission to push directly to the official project (e.g. facebook/react). Instead, you fork it to your own GitHub account (your-username/react) and clone your fork.',
          'This sets up the classic Open-Source Triangle Workflow:\n• origin → Points to YOUR personal fork on GitHub (where you push your feature branches).\n• upstream → Points to the OFFICIAL maintainer repository (where you fetch the latest community updates from).'
        ],
        keyTakeaways: [
          '`git remote -v` lists all configured remote names and their fetch/push URLs.',
          '`origin` is your personal GitHub fork; `upstream` is the original parent repository.',
          'Add the upstream remote once after cloning your fork via `git remote add upstream <original-repo-url>`.'
        ],
        diagramType: 'fork-workflow',
        commands: [
          {
            command: 'git remote -v',
            description: 'List all configured remote names and their URLs.'
          },
          {
            command: 'git remote add upstream https://github.com/facebook/react.git',
            description: 'Register the official upstream repository so you can pull future updates.'
          }
        ],
        sandboxCommand: 'git remote add upstream https://github.com/facebook/react.git && git remote -v',
        expectedOutput: `origin\thttps://github.com/alex-rivera/react.git (fetch)\norigin\thttps://github.com/alex-rivera/react.git (push)\nupstream\thttps://github.com/facebook/react.git (fetch)\nupstream\thttps://github.com/facebook/react.git (push)\n✓ Open-source triangle remotes configured!`,
        commonPitfall: {
          title: 'Cloning the Upstream Repo Directly Instead of Your Fork',
          description:
            'If you clone `facebook/react` directly instead of your fork, `origin` points to `facebook/react`. When you try to run `git push origin my-branch`, GitHub will reject it with `Permission to facebook/react.git denied`!'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to inspect all configured remote names and their fetch/push URLs (`git remote -v`):',
          acceptedCommands: ['git remote -v', 'git remote --verbose'],
          placeholder: 'git remote ...',
          hint: 'Pass the `-v` (`--verbose`) flag to `git remote`.',
          explanation:
            '`git remote -v` prints each configured remote alias alongside its fetch and push URLs.'
        }
      },
      {
        id: 'lesson-17',
        number: 17,
        levelId: 'level-3',
        title: 'Pushing & Pulling: git push, git fetch vs git pull',
        duration: '7 min',
        summary:
          'Understand the difference between downloading remote commits safely with git fetch and immediately merging them with git pull.',
        conceptParagraphs: [
          'Working with remotes involves uploading your commits (`git push`) and downloading commits from collaborators (`git fetch` and `git pull`).',
          'git fetch <remote> downloads new commits and branch pointers from the remote into remote-tracking branches (like origin/main or upstream/main) WITHOUT modifying your current working directory or local main branch. This lets you inspect incoming changes first.',
          'git pull is simply a shortcut that runs git fetch followed immediately by git merge (or git rebase if you pass --rebase). When pushing a brand-new local branch for the first time, pass -u (`git push -u origin <branch>`) to link your local branch to the remote branch.'
        ],
        keyTakeaways: [
          '`git fetch` downloads remote data safely without touching your working files.',
          '`git pull` = `git fetch` + `git merge` (or `git pull --rebase` = `git fetch` + `git rebase`).',
          '`git push -u origin <branch>` uploads your branch and sets up upstream tracking.'
        ],
        commands: [
          {
            command: 'git fetch upstream',
            description: 'Download latest commits from the upstream repository without modifying local files.'
          },
          {
            command: 'git push -u origin fix/issue-104-dropdown-escape',
            description: 'Push your feature branch to your fork and set upstream tracking.'
          },
          {
            command: 'git pull --rebase upstream main',
            description: 'Fetch latest upstream main and replay local commits cleanly on top.'
          }
        ],
        sandboxCommand: 'git push -u origin fix/issue-104-dropdown-escape',
        expectedOutput: `Enumerating objects: 7, done.\nCounting objects: 100% (7/7), done.\nTo https://github.com/alex-rivera/project.git\n * [new branch]      fix/issue-104-dropdown-escape -> fix/issue-104-dropdown-escape\nbranch 'fix/issue-104-dropdown-escape' set up to track 'origin/fix/issue-104-dropdown-escape'.`,
        commonPitfall: {
          title: 'Running `git pull` With Uncommitted Local Changes',
          description:
            'If you prefer to see what changed on the remote before altering your working directory, run `git fetch` first and inspect `git log HEAD..origin/main --oneline`.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'What is the exact difference between `git fetch` and `git pull`?',
          options: [
            '`git fetch` downloads new remote commits without modifying your local working branch, whereas `git pull` runs `git fetch` and immediately merges/rebases them into your current branch',
            '`git fetch` uploads commits to GitHub, while `git pull` deletes local branches',
            '`git fetch` only works on private repositories, while `git pull` works on public repositories',
            'There is no difference; they are aliases for the exact same command'
          ],
          correctOptionIndex: 0,
          hint: '`git pull` combines two operations into one.',
          explanation:
            '`git fetch` updates remote-tracking refs (like `origin/main`) safely without touching your active branch, while `git pull` fetches and immediately integrates those commits.'
        }
      },
      {
        id: 'lesson-18',
        number: 18,
        levelId: 'level-3',
        title: 'Forking a Repository on GitHub (The Open-Source Model)',
        duration: '6 min',
        summary:
          'Understand why server-side forks enable thousands of external contributors to propose changes safely without write access.',
        conceptParagraphs: [
          'How can an open-source project like Linux, VS Code, or Next.js accept code from thousands of university students worldwide without giving strangers permission to break the main branch? The answer is the Fork & Pull model.',
          'Clicking "Fork" in the top-right corner of a GitHub repository creates a server-side copy of that repository under your personal GitHub namespace (e.g., github.com/your-username/next.js).',
          'You have full admin and push access to your fork. You clone your fork locally, push your feature branch to your fork, and then ask the maintainers of the original repository to pull your branch via a Pull Request.'
        ],
        keyTakeaways: [
          'A Fork is a server-side copy of a repository under your own GitHub account.',
          'You push branches to your Fork (`origin`), then open a Pull Request targeting the parent repository (`upstream`).',
          'Never delete your fork while your Pull Request is still open—doing so closes or orphans your PR branch!'
        ],
        commands: [
          {
            command: 'git clone https://github.com/YOUR-USERNAME/target-repo.git',
            description: 'Clone your personal GitHub fork to your local machine.'
          },
          {
            command: 'git remote add upstream https://github.com/ORIGINAL-ORG/target-repo.git',
            description: 'Link the original organization repository as upstream.'
          }
        ],
        sandboxCommand: 'git clone https://github.com/alex-rivera/next.js.git',
        expectedOutput: `Cloning into 'next.js'...\nremote: Enumerating objects: 1420, done.\nReceiving objects: 100% (1420/1420), 4.18 MiB | 11.20 MiB/s, done.\n✓ Personal fork cloned locally with origin -> alex-rivera/next.js`,
        commonPitfall: {
          title: 'Deleting Your Fork Before Your Pull Request Is Merged',
          description:
            'Your Pull Request streams commits directly from the branch hosted in your fork. Keep your fork and feature branch intact until the maintainer merges your PR!'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'In the GitHub Fork & Pull open-source workflow, where do you `git push` your new feature branch?',
          options: [
            'To `origin` (your personal fork on GitHub), and then open a Pull Request toward the `upstream` repository',
            'Directly to `upstream/main` using `--force`',
            'You email `.zip` files of your working directory to the maintainer',
            'Directly to the maintainer’s personal laptop via SSH'
          ],
          correctOptionIndex: 0,
          hint: 'Which remote do you have write/push permissions for?',
          explanation:
            'Contributors have write access to their own fork (`origin`), so you push your branch to `origin` and open a Pull Request into `upstream`.'
        }
      },
      {
        id: 'lesson-19',
        number: 19,
        levelId: 'level-3',
        title: 'Keeping a Fork in Sync with Upstream',
        duration: '7 min',
        summary:
          'Prevent stale branches and merge conflicts by syncing your local main branch with upstream/main before starting every new issue.',
        conceptParagraphs: [
          'Active open-source repositories merge dozens of Pull Requests every day. If you forked a project two weeks ago, your fork’s main branch is now out of date compared to the official upstream/main branch.',
          'Before creating a branch for a new issue, always synchronize your local main branch:\n1. Switch to main: `git switch main`\n2. Fetch the latest commits from upstream: `git fetch upstream`\n3. Fast-forward your local main: `git merge upstream/main` (or `git rebase upstream/main`)\n4. Update your GitHub fork: `git push origin main`'
        ],
        keyTakeaways: [
          'Always sync `main` with `upstream/main` BEFORE creating a new feature branch.',
          '`git fetch upstream && git merge upstream/main` brings your local `main` up to date.',
          'GitHub’s web UI also has a "Sync fork" button that updates `origin/main` in one click.'
        ],
        commands: [
          {
            command: 'git switch main && git fetch upstream && git merge upstream/main',
            description: 'Fetch latest commits from the official repository and fast-forward your local main branch.'
          },
          {
            command: 'git push origin main',
            description: 'Push the updated main branch to your personal GitHub fork.'
          }
        ],
        sandboxCommand: 'git fetch upstream && git merge upstream/main',
        expectedOutput: `From https://github.com/ORIGINAL-ORG/target-repo\n * branch            main       -> FETCH_HEAD\n   92e1a4c..b83e112  main       -> upstream/main\nUpdating 92e1a4c..b83e112\nFast-forward\n 14 files changed, 210 insertions(+), 45 deletions(-)\n✓ Local main branch is now 100% in sync with upstream/main!`,
        commonPitfall: {
          title: 'Making Local Commits Directly on `main` in Your Fork',
          description:
            'If you keep your local `main` branch clean (never committing directly to `main`), `git merge upstream/main` will ALWAYS be a clean, conflict-free Fast-Forward merge!'
        },
        quiz: {
          type: 'command-input',
          question:
            'Assuming you are on `main` and have already run `git fetch upstream`, type the command to merge the latest `upstream/main` branch into your local `main`:',
          acceptedCommands: [
            'git merge upstream/main',
            'git rebase upstream/main',
            'git pull upstream main'
          ],
          placeholder: 'git merge ...',
          hint: 'Merge the remote-tracking branch `upstream/main`.',
          explanation:
            '`git merge upstream/main` fast-forwards your local `main` branch to match the latest commits fetched from `upstream`.'
        }
      },
      {
        id: 'lesson-20',
        number: 20,
        levelId: 'level-3',
        title: 'Creating a Pull Request (Step-by-Step Walkthrough)',
        duration: '7 min',
        summary:
          'Walk through opening a Pull Request on GitHub, selecting base vs compare branches, and passing automated CI checks.',
        conceptParagraphs: [
          'Once you push your feature branch (`git push -u origin fix/issue-104`), visit the repository on GitHub. You will see a banner: "fix/issue-104 had recent pushes — Compare & pull request".',
          'Verify the two branch dropdowns at the top of the Pull Request page:\n• base repository: `original-org/repo` (base: `main`) — where your changes want to go.\n• head repository: `your-username/repo` (compare: `fix/issue-104`) — where your changes come from.',
          'Before clicking "Create pull request", review the "Files changed" tab yourself to confirm only the intended lines were modified and no debug `console.log` statements slipped in. If you want early feedback before the PR is ready to merge, open it as a Draft Pull Request.'
        ],
        keyTakeaways: [
          '`base` is the target branch in the upstream repo (`main`); `compare` (`head`) is your feature branch in your fork.',
          'Always self-review the "Files changed" diff tab on GitHub before submitting your PR.',
          'Use a Draft PR if you want to verify CI tests or ask a maintainer a question before final review.'
        ],
        commands: [
          {
            command: 'git diff upstream/main...HEAD',
            description: 'Preview the exact diff that GitHub will show in your Pull Request before pushing.'
          },
          {
            command: 'git status --ignored',
            description: 'Double-check your workspace status before pushing your PR branch.'
          }
        ],
        sandboxCommand: 'git diff upstream/main...HEAD',
        expectedOutput: `diff --git a/src/components/Dropdown.tsx b/src/components/Dropdown.tsx\n--- a/src/components/Dropdown.tsx\n+++ b/src/components/Dropdown.tsx\n@@ -42,4 +42,7 @@\n+  if (event.key === 'Escape') closeMenu();\n✓ Diff verified: 1 file changed, 3 insertions(+), 0 unintended edits.`,
        commonPitfall: {
          title: 'Opening a PR Against Your Own Fork Instead of Upstream',
          description:
            'Make sure the left `base repository` dropdown points to the upstream organization (`org/repo:main`), not your own fork (`your-username/repo:main`), so the maintainers actually see your Pull Request.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'When opening a Pull Request on GitHub from your fork to an open-source project, what should the `base` and `head (compare)` branches be set to?',
          options: [
            '`base`: upstream repository `main` ← `head`: your fork’s feature branch',
            '`base`: your fork’s feature branch ← `head`: upstream repository `main`',
            '`base`: upstream `main` ← `head`: upstream `main`',
            '`base`: local disk ← `head`: `.gitignore`'
          ],
          correctOptionIndex: 0,
          hint: 'Arrows on GitHub PRs point from right (`head/compare`) into left (`base`).',
          explanation:
            'In GitHub’s PR header (`base ← compare`), `base` is the destination branch in the upstream repository and `compare` (`head`) is your feature branch in your fork.'
        }
      },
      {
        id: 'lesson-21',
        number: 21,
        levelId: 'level-3',
        title: 'Responding to Code Review Feedback & Updating a PR',
        duration: '7 min',
        summary:
          'Learn how to update an open Pull Request by pushing new commits to the same branch—never close and reopen a new PR for review changes.',
        conceptParagraphs: [
          'Code review is a collaborative learning conversation, not a pass/fail exam. Almost every open-source Pull Request receives change requests from maintainers regarding edge cases, naming, or test coverage.',
          'A very common beginner mistake is closing the Pull Request and opening a brand-new PR after making requested edits. Do NOT do this—it destroys the review comment history!',
          'Instead, simply stay on the exact same feature branch locally, edit the files, commit the improvements, and run `git push origin <your-branch>`. GitHub automatically appends the new commit to your open Pull Request and re-runs the CI test suite.'
        ],
        keyTakeaways: [
          'To update an open Pull Request, simply commit and `git push` to the SAME feature branch.',
          'Never close an open PR just to submit review fixes—keep all discussion context in one place.',
          'Reply concisely to each review comment and mark conversations resolved once addressed.'
        ],
        commands: [
          {
            command: 'git add src/components/Dropdown.test.tsx && git commit -m "test(dropdown): add unit test for Escape key handler"',
            description: 'Stage and commit the changes requested by the reviewer on your existing branch.'
          },
          {
            command: 'git push origin fix/issue-104-dropdown-escape',
            description: 'Push the new commit to your fork; GitHub updates the open PR automatically.'
          }
        ],
        sandboxCommand: 'git push origin fix/issue-104-dropdown-escape',
        expectedOutput: `To https://github.com/alex-rivera/project.git\n   e41d90a..f09c3b1  fix/issue-104-dropdown-escape -> fix/issue-104-dropdown-escape\n✓ Open Pull Request #108 automatically updated with commit f09c3b1!`,
        commonPitfall: {
          title: 'Closing an Open PR and Opening a New One to Fix Review Comments',
          description:
            'Closing a PR loses all inline review threads and forces maintainers to re-review from scratch. Pushing a new commit to the existing branch updates the open PR seamlessly.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'A maintainer leaves a review comment on your open Pull Request asking you to rename a variable and add a unit test. How should you submit those changes?',
          options: [
            'Edit the files on the same local branch, make a new commit, and `git push` to the same branch on `origin`',
            'Close the Pull Request, delete your fork, re-fork the repository, and open a new PR',
            'Edit the files on `main` and open a second Pull Request alongside the first one',
            'Paste the updated file contents into a comment box without pushing to Git'
          ],
          correctOptionIndex: 0,
          hint: 'A Pull Request dynamically tracks the branch it was opened from.',
          explanation:
            'Pushing new commits to the same branch on `origin` automatically updates the existing Pull Request and preserves all review threads.'
        }
      },
      {
        id: 'lesson-22',
        number: 22,
        levelId: 'level-3',
        title: 'GitHub Issues: Etiquette & Linking PRs (`Closes #123`)',
        duration: '6 min',
        summary:
          'Practice open-source issue etiquette, verify an issue is unassigned, and use GitHub magic keywords (`Closes #123`) to auto-close issues on merge.',
        conceptParagraphs: [
          'Before writing code for an issue, read the entire issue thread and check the "Assignees" and "Development" sidebar on GitHub to make sure another contributor hasn’t already opened a Pull Request for it.',
          'Instead of commenting "Can I be assigned?" and waiting days with no code, briefly state your proposed technical approach (e.g., "I reproduced this locally and plan to add a guard in `parseConfig.ts`—opening a PR shortly").',
          'When you open your Pull Request, include a linking keyword in the PR description body such as `Closes #123`, `Fixes #123`, or `Resolves #123`. This links your PR in the issue’s sidebar and automatically closes the issue the instant your PR is merged into `main`!'
        ],
        keyTakeaways: [
          'Check both the Assignees list and open linked PRs before starting work on an issue.',
          'Include `Closes #<issue-number>` or `Fixes #<issue-number>` in your PR description body.',
          'GitHub automatically closes the linked issue when a PR containing `Closes #123` merges into the default branch.'
        ],
        commands: [
          {
            command: 'git commit -m "fix(dropdown): close menu on Escape key (Closes #104)"',
            description: 'Reference and auto-link issue #104 directly in the commit/PR metadata.'
          }
        ],
        sandboxCommand: 'git commit -m "fix(dropdown): close menu on Escape key (Closes #104)"',
        expectedOutput: `[fix/issue-104-dropdown-escape a18d4e2] fix(dropdown): close menu on Escape key (Closes #104)\n✓ GitHub cross-reference detected: Issue #104 will auto-close when merged to main.`,
        commonPitfall: {
          title: 'Putting `Closes #123` Only in the PR Title Instead of the PR Body',
          description:
            'GitHub’s automatic issue-closing parser reads the Pull Request description body and commit messages—always include `Closes #123` inside the PR description body!'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which keyword phrase placed in a Pull Request description automatically links and closes GitHub Issue #42 when the PR is merged?',
          options: [
            'Closes #42 (or Fixes #42)',
            'Related to issue 42',
            '@issue-42-done',
            'Delete #42'
          ],
          correctOptionIndex: 0,
          hint: 'GitHub recognizes `Closes #N`, `Fixes #N`, and `Resolves #N`.',
          explanation:
            '`Closes #42`, `Fixes #42`, and `Resolves #42` are official GitHub keywords that link the PR to Issue #42 and close it automatically upon merge.'
        }
      }
    ]
  },
  {
    id: 'level-4',
    number: 4,
    title: 'Collaboration & Best Practices',
    badge: 'Advanced',
    description:
      'Compare industry branching workflows, craft maintainer-grade PR descriptions, sign commits with GPG/SSH, automate checks with Git Hooks, cherry-pick commits, tag semantic releases, and configure aliases.',
    lessons: [
      {
        id: 'lesson-23',
        number: 23,
        levelId: 'level-4',
        title: 'Git Workflows: Feature Branch, Gitflow & Trunk-Based Development',
        duration: '8 min',
        summary:
          'Compare the three dominant branching strategies used across open-source projects and enterprise engineering teams.',
        conceptParagraphs: [
          'Different engineering teams organize their branches using one of three primary workflows:',
          '1. Feature Branch Workflow (GitHub Flow): A single long-lived `main` branch is always deployable. Developers create short-lived feature branches (`feat/...`, `fix/...`), open a PR, pass CI, and merge back into `main`. Used by 90%+ of modern open-source repos.',
          '2. Gitflow: Uses two long-lived branches (`main` for tagged production releases and `develop` for integration), plus `feature/*`, `release/*`, and `hotfix/*` branches. Common in scheduled enterprise software or mobile app store releases.',
          '3. Trunk-Based Development: Developers merge very small, incremental commits into `main` ("trunk") multiple times a day, using feature flags in code to hide unfinished features until ready.'
        ],
        keyTakeaways: [
          'Feature Branch / GitHub Flow (`main` + short-lived PR branches) is the standard in modern open source.',
          'Gitflow separates `main` and `develop` for versioned release cycles.',
          'Trunk-Based Development emphasizes tiny daily merges into `main` guarded by feature flags.'
        ],
        diagramType: 'git-workflows',
        commands: [
          {
            command: 'git branch -r',
            description: 'Inspect remote branches to see if a repository uses only main (GitHub Flow) or develop/release/* (Gitflow).'
          }
        ],
        sandboxCommand: 'git branch -r',
        expectedOutput: `  origin/HEAD -> origin/main\n  origin/main\n  upstream/main\n✓ Repository uses GitHub Feature Branch Workflow (target base: main).`,
        commonPitfall: {
          title: 'Targeting `main` When a Gitflow Repository Expects PRs Against `develop`',
          description:
            'Some Gitflow repositories integrate all community PRs into `develop` or `next` first. Always check `git branch -r` and `CONTRIBUTING.md` to confirm which base branch your PR should target.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'How does Trunk-Based Development differ from Gitflow?',
          options: [
            'Trunk-Based Development merges small changes frequently into a single `main` branch (often using feature flags), whereas Gitflow maintains separate long-lived `main`, `develop`, and `release/*` branches',
            'Trunk-Based Development never uses automated tests',
            'Gitflow prohibits the use of branches entirely',
            'Trunk-Based Development requires every developer to work without an internet connection'
          ],
          correctOptionIndex: 0,
          hint: 'Compare a single trunk (`main`) with frequent small integrations vs multiple long-lived release branches.',
          explanation:
            'Trunk-Based Development integrates small batches directly into `main` continuously, while Gitflow coordinates scheduled releases across `develop`, `release/*`, `hotfix/*`, and `main`.'
        }
      },
      {
        id: 'lesson-24',
        number: 24,
        levelId: 'level-4',
        title: 'Writing a High-Signal Pull Request Description',
        duration: '7 min',
        summary:
          'Structure your Pull Request description so busy maintainers can review and merge your contribution in under 3 minutes.',
        conceptParagraphs: [
          'Open-source maintainers review dozens of Pull Requests in their spare time. A PR with an empty description forces the maintainer to reverse-engineer what problem you are solving and how you tested it—leading to long delays.',
          'A great Pull Request description answers four questions clearly:\n1. **What & Why**: Link the issue (`Closes #104`) and summarize the root cause in 1–2 sentences.\n2. **How**: Briefly explain the technical approach and any trade-offs.\n3. **Verification / Testing**: List the exact test commands run (`npm test`, `npm run build`) and what new unit tests were added.\n4. **Screenshots (for UI changes)**: Attach before/after screenshots at desktop and mobile widths.'
        ],
        keyTakeaways: [
          'Always respect the repository’s `.github/PULL_REQUEST_TEMPLATE.md` checkboxes if one pops up.',
          'Include `Closes #<id>`, Root Cause, Solution Summary, and Test Verification steps.',
          'For UI fixes, attaching a before/after screenshot cuts review turnaround time in half.'
        ],
        commands: [
          {
            command: 'git log upstream/main..HEAD --oneline',
            description: 'List all commits included in your branch to summarize them in your PR body.'
          },
          {
            command: 'git diff --stat upstream/main...HEAD',
            description: 'Generate a file-by-file change summary for your PR description.'
          }
        ],
        sandboxCommand: 'git diff --stat upstream/main...HEAD',
        expectedOutput: ` src/components/Dropdown.tsx      | 10 ++++++++--\n src/components/Dropdown.test.tsx | 24 ++++++++++++++++++++++++\n 2 files changed, 32 insertions(+), 2 deletions(-)\n✓ Ready to document in Pull Request template!`,
        commonPitfall: {
          title: 'Deleting the Repository’s `.github/PULL_REQUEST_TEMPLATE.md`',
          description:
            'When you open a PR on GitHub, many repos pre-fill the text box with a markdown template. Never delete that template! Fill out every section and check the applicable `[x]` boxes.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which set of elements makes a Pull Request easiest and fastest for an open-source maintainer to review and merge?',
          options: [
            'Linked issue (`Closes #123`), concise summary of root cause & solution, test commands verified, and before/after screenshots for UI changes',
            'Leaving the description blank because "the code speaks for itself"',
            'Pasting the entire 2,000-line source file into the PR comment box',
            'Tagging 15 maintainers with `@` mentions every hour after opening the PR'
          ],
          correctOptionIndex: 0,
          hint: 'Think about what context a reviewer needs before reading the code diff.',
          explanation:
            'Providing the linked issue, root cause, solution overview, test verification, and UI screenshots gives maintainers complete confidence in your PR.'
        }
      },
      {
        id: 'lesson-25',
        number: 25,
        levelId: 'level-4',
        title: 'Signing Commits & Cryptographic Verification (GPG / SSH)',
        duration: '6 min',
        summary:
          'Earn the green "Verified" badge on GitHub by cryptographically signing your commits with GPG or SSH keys.',
        conceptParagraphs: [
          'By default, anyone can run `git config user.email "torvalds@linux-foundation.org"` and create a commit claiming to be Linus Torvalds. Git does not verify author identity unless commits are cryptographically signed.',
          'When you configure GPG or SSH commit signing (supported natively since Git 2.34 using your existing SSH key!), passing `-S` (`git commit -S -m "..."`) attaches a cryptographic signature to the commit object.',
          'Once your public GPG or SSH signing key is uploaded to GitHub Settings → SSH and GPG keys, GitHub displays a green **Verified** badge next to every commit you push. Some security-critical open-source organizations require signed commits before merging.'
        ],
        keyTakeaways: [
          'Unsigned `git config user.name/email` is self-reported; cryptographic signing proves authenticity.',
          'Git 2.34+ allows signing commits with your existing SSH key (`gpg.format ssh`) as well as GPG keys.',
          '`git config --global commit.gpgsign true` automatically signs every commit you make.'
        ],
        commands: [
          {
            command: 'git commit -S -m "feat(security): enforce strict Content-Security-Policy header"',
            description: 'Create a cryptographically signed commit (-S).'
          },
          {
            command: 'git config --global commit.gpgsign true',
            description: 'Configure Git to sign all future commits automatically.'
          },
          {
            command: 'git log --show-signature -n 1',
            description: 'Verify the cryptographic signature on the most recent commit.'
          }
        ],
        sandboxCommand: 'git commit -S -m "feat(security): enforce strict Content-Security-Policy header"',
        expectedOutput: `gpg: Signature made using ED25519 key SHA256:9f82b1c4...\ngpg: Good signature from "Alex Rivera <alex.rivera@university.edu>" [ultimate]\n[sec/csp 3d81e04] feat(security): enforce strict Content-Security-Policy header\n✓ Commit signed and Verified!`,
        commonPitfall: {
          title: 'Confusing Capital `-S` (GPG/SSH Sign) with Lowercase `-s` (Signed-off-by DCO)',
          description:
            '`git commit -S` cryptographically signs the commit with your GPG/SSH key. Lowercase `git commit -s` (`--signoff`) simply appends a plain-text `Signed-off-by: Name <email>` line at the bottom of your commit message for Developer Certificate of Origin (DCO) compliance.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'What is the difference between `git commit -S` (uppercase) and `git commit -s` (lowercase)?',
          options: [
            '`-S` cryptographically signs the commit with a GPG/SSH key (producing GitHub’s "Verified" badge), whereas `-s` appends a plain-text `Signed-off-by:` DCO line to the commit message',
            '`-S` stages all files, whereas `-s` stashes them',
            '`-S` pushes to a secret branch, whereas `-s` squashes commits',
            'They are identical flags'
          ],
          correctOptionIndex: 0,
          hint: 'Uppercase `-S` is cryptographic signing; lowercase `-s` is `--signoff` text.',
          explanation:
            '`-S` performs cryptographic GPG/SSH signing, while `-s` (`--signoff`) adds a plain-text `Signed-off-by:` trailer required by Linux Foundation DCO repos.'
        }
      },
      {
        id: 'lesson-26',
        number: 26,
        levelId: 'level-4',
        title: 'Git Hooks (pre-commit, commit-msg & pre-push)',
        duration: '6 min',
        summary:
          'Understand how automated Git Hooks run linters, formatters, and tests locally before bad code can be committed or pushed.',
        conceptParagraphs: [
          'Git Hooks are automated scripts stored inside `.git/hooks/` (often managed across teams by tools like Husky or pre-commit) that Git executes automatically when specific events occur.',
          '• `pre-commit`: Runs right after you type `git commit`, before the commit message editor even opens. Commonly runs ESLint, Prettier, or TypeScript type-checking on staged files. If the script exits with a non-zero error code, the commit is aborted so you can fix the lint error first.',
          '• `commit-msg`: Validates that your commit message follows the repository’s format (such as Conventional Commits).',
          '• `pre-push`: Runs unit tests right before `git push` sends commits to GitHub.'
        ],
        keyTakeaways: [
          'Git Hooks catch formatting, lint, and test failures locally in seconds instead of waiting 10 minutes for GitHub Actions CI.',
          'If a `pre-commit` hook fails, fix the reported lint/type error, `git add` the fix, and run `git commit` again.',
          'Never bypass hooks with `--no-verify` when contributing to open source, or your PR will fail in CI.'
        ],
        commands: [
          {
            command: 'ls -la .git/hooks',
            description: 'Inspect the hook scripts present in the local repository.'
          },
          {
            command: 'git commit -m "feat(api): add rate limit middleware"',
            description: 'Trigger pre-commit and commit-msg hooks automatically during commit.'
          }
        ],
        sandboxCommand: 'git commit -m "feat(api): add rate limit middleware"',
        expectedOutput: `> Running pre-commit hook (lint-staged)...\n  ✔ eslint --fix passed (0 errors)\n  ✔ tsc --noEmit passed\n> Running commit-msg hook (commitlint)...\n  ✔ Conventional Commit format verified\n[feat/rate-limit 6c20a99] feat(api): add rate limit middleware`,
        commonPitfall: {
          title: 'Bypassing Hooks with `--no-verify` to Force a Broken Commit Through',
          description:
            'While `git commit --no-verify` skips local hooks, open-source repositories run the exact same checks in GitHub Actions CI. Fix the lint or test issue locally so your PR stays green.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which Git hook runs automatically right when you invoke `git commit` to check staged files with linters/formatters before the commit is created?',
          options: [
            'pre-commit',
            'post-merge',
            'after-clone',
            'remote-init'
          ],
          correctOptionIndex: 0,
          hint: 'It runs *before* (`pre-`) a commit is recorded.',
          explanation:
            'The `pre-commit` hook executes before a commit is finalized and aborts the commit if linters, formatters, or type checks return a non-zero exit code.'
        }
      },
      {
        id: 'lesson-27',
        number: 27,
        levelId: 'level-4',
        title: 'Cherry-Picking Commits: git cherry-pick',
        duration: '6 min',
        summary:
          'Copy a single specific commit from one branch onto another branch without merging the entire branch.',
        conceptParagraphs: [
          'Sometimes you only want to bring a single specific commit from another branch into your current branch—for example, when backporting a critical security fix from `main` to a `release/v1.x` branch, or rescuing a single clean commit from an experimental branch.',
          'Running `git cherry-pick <commit-sha>` takes the exact patch introduced by `<commit-sha>` and applies it as a brand-new commit on top of your currently checked-out branch.',
          'This is also a lifesaver if you accidentally made a commit on the wrong branch: switch to the right branch, `git cherry-pick <sha>`, and reset the old branch!'
        ],
        keyTakeaways: [
          '`git cherry-pick <sha>` copies a single commit’s diff onto your current branch as a new commit.',
          'Ideal for backporting bugfixes to release branches or moving a commit made on the wrong branch.',
          'Pass `-x` (`git cherry-pick -x <sha>`) when backporting so Git records `(cherry picked from commit ...)` in the message.'
        ],
        commands: [
          {
            command: 'git cherry-pick 92e1a4c',
            description: 'Apply commit 92e1a4c onto the currently active branch.'
          },
          {
            command: 'git cherry-pick -x 92e1a4c',
            description: 'Cherry-pick and append a reference to the original commit SHA in the commit message.'
          }
        ],
        sandboxCommand: 'git cherry-pick -x 92e1a4c',
        expectedOutput: `[release/v1.2 5f01b8e] fix(parser): handle empty JSON payload without throwing\n (cherry picked from commit 92e1a4c8d102f3e4a9b1)\n 1 file changed, 7 insertions(+), 2 deletions(-)\n✓ Commit backported cleanly to current branch!`,
        commonPitfall: {
          title: 'Cherry-Picking Dozens of Interdependent Commits Instead of Merging/Rebasing',
          description:
            '`git cherry-pick` creates duplicate commits with new SHAs. Use it surgically for 1–2 isolated commits (like hotfixes or rescuing a misplaced commit), not as a replacement for regular branch merging.'
        },
        quiz: {
          type: 'command-input',
          question:
            'Type the command to copy and apply the single commit `92e1a4c` onto your currently checked-out branch:',
          acceptedCommands: [
            'git cherry-pick 92e1a4c',
            'git cherry-pick -x 92e1a4c'
          ],
          placeholder: 'git cherry-pick ...',
          hint: 'Use `git cherry-pick <commit-sha>`.',
          explanation:
            '`git cherry-pick 92e1a4c` applies the changes introduced by commit `92e1a4c` as a new commit on your active branch.'
        }
      },
      {
        id: 'lesson-28',
        number: 28,
        levelId: 'level-4',
        title: 'Tags & Releases: git tag & Semantic Versioning (SemVer)',
        duration: '6 min',
        summary:
          'Mark permanent release milestones with annotated Git tags and understand MAJOR.MINOR.PATCH semantic versioning.',
        conceptParagraphs: [
          'Unlike branches, which move forward with every new commit, a `git tag` is an immutable bookmark permanently pinned to a specific release commit (such as `v1.4.0` or `v2.0.0`).',
          'Open-source libraries follow Semantic Versioning (SemVer): `vMAJOR.MINOR.PATCH` (e.g., `v2.4.1`):\n• **MAJOR** (`2`): Incompatible breaking API changes.\n• **MINOR** (`4`): New backward-compatible features (`feat:`).\n• **PATCH** (`1`): Backward-compatible bug fixes (`fix:`).',
          'Always prefer Annotated Tags (`git tag -a v1.4.0 -m "Release v1.4.0"`) over lightweight tags for releases because annotated tags store the tagger’s identity, date, release notes, and optional GPG signature. Remember that `git push` does not push tags by default—use `git push origin --tags` or `git push origin v1.4.0`.'
        ],
        keyTakeaways: [
          'SemVer format `MAJOR.MINOR.PATCH`: Breaking change → MAJOR; New feature → MINOR; Bug fix → PATCH.',
          'Create annotated release tags with `git tag -a v1.2.0 -m "Release v1.2.0"`.',
          'Push tags explicitly to GitHub with `git push origin v1.2.0` or `git push origin --tags`.'
        ],
        commands: [
          {
            command: 'git tag -a v1.2.0 -m "Release v1.2.0: Add keyboard navigation"',
            description: 'Create an annotated release tag at the current commit.'
          },
          {
            command: 'git push origin v1.2.0',
            description: 'Push the specific release tag to GitHub to trigger a release.'
          },
          {
            command: 'git tag -l',
            description: 'List all existing version tags in the repository.'
          }
        ],
        sandboxCommand: 'git tag -a v1.2.0 -m "Release v1.2.0" && git tag -l',
        expectedOutput: `v1.0.0\nv1.1.0\nv1.1.1\nv1.2.0\n✓ Annotated tag v1.2.0 created following Semantic Versioning!`,
        commonPitfall: {
          title: 'Assuming `git push` Automatically Uploads Local Tags',
          description:
            'Standard `git push` only pushes branch commits, not tags! To publish a tag to GitHub, explicitly run `git push origin <tag-name>`.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'According to Semantic Versioning (`MAJOR.MINOR.PATCH`), if a library is currently at `v1.4.2` and you merge a backward-compatible new feature (`feat:`), what should the next version tag be?',
          options: [
            'v1.5.0',
            'v2.0.0',
            'v1.4.3',
            'v1.4.2-patch'
          ],
          correctOptionIndex: 0,
          hint: 'Backward-compatible features increment the middle (`MINOR`) number and reset `PATCH` to `0`.',
          explanation:
            'In SemVer, adding a backward-compatible new feature increments the `MINOR` version and resets `PATCH` to zero (`v1.4.2` → `v1.5.0`).'
        }
      },
      {
        id: 'lesson-29',
        number: 29,
        levelId: 'level-4',
        title: 'Git Submodules (Conceptual Overview & Initialization)',
        duration: '6 min',
        summary:
          'Recognize when an open-source repository embeds external Git repositories via .gitmodules and how to initialize them.',
        conceptParagraphs: [
          'Large C++, Rust, game engine, or documentation repositories often depend on external sub-projects or shared specification repos. A Git Submodule allows a repository to embed another external Git repository at a specificsubdirectory pinned to an exact commit SHA.',
          'When you clone a parent repository that uses submodules (indicated by a `.gitmodules` file in the root), the submodule directories initially appear empty!',
          'To populate them, either pass `--recurse-submodules` when cloning (`git clone --recurse-submodules <url>`), or run `git submodule update --init --recursive` inside the already-cloned repository.'
        ],
        keyTakeaways: [
          'A Submodule pins an external Git repository to a specific commit SHA inside a parent repository.',
          'Look for a `.gitmodules` file in the root directory to see if a project uses submodules.',
          'Run `git submodule update --init --recursive` if a cloned repo has empty vendor/sub-project folders.'
        ],
        commands: [
          {
            command: 'git submodule update --init --recursive',
            description: 'Initialize, fetch, and check out all nested submodules in an already-cloned repository.'
          },
          {
            command: 'git clone --recurse-submodules https://github.com/org/engine.git',
            description: 'Clone a repository and automatically initialize all of its submodules.'
          }
        ],
        sandboxCommand: 'git submodule update --init --recursive',
        expectedOutput: `Submodule 'vendor/tree-sitter- grammar' (https://github.com/tree-sitter/tree-sitter.git) registered for path 'vendor/grammar'\nCloning into '/home/student/repo/vendor/grammar'...\nSubmodule path 'vendor/grammar': checked out '8b92f10e4c11a'\n✓ All submodules initialized and pinned to verified commit SHAs!`,
        commonPitfall: {
          title: 'Wondering Why Build Scripts Fail With "Directory Empty" After `git clone`',
          description:
            'If a C++/Rust/Docs project fails to build right after `git clone` because a `third_party/` or `themes/` folder is empty, check for `.gitmodules` and run `git submodule update --init --recursive`.'
        },
        quiz: {
          type: 'command-input',
          question:
            'You already cloned a repository and noticed its submodule folders are empty. Type the command to initialize and fetch its submodules (`git submodule update --init --recursive`):',
          acceptedCommands: [
            'git submodule update --init --recursive',
            'git submodule update --init'
          ],
          placeholder: 'git submodule update ...',
          hint: 'Use `git submodule update --init --recursive`.',
          explanation:
            '`git submodule update --init --recursive` registers and checks out the exact pinned commits for all submodules in the project.'
        }
      },
      {
        id: 'lesson-30',
        number: 30,
        levelId: 'level-4',
        title: 'Git Aliases & Developer Productivity Tips',
        duration: '6 min',
        summary:
          'Speed up your daily CLI workflow with custom Git aliases, autocorrect, and branch sorting.',
        conceptParagraphs: [
          'Experienced open-source maintainers rarely type out long commands like `git log --oneline --graph --decorate --all` every time. Git lets you define custom shortcuts called Aliases inside your `~/.gitconfig`.',
          'For example, running `git config --global alias.lg "log --oneline --graph --decorate --all"` creates the command `git lg`. Similarly, `alias.st "status -sb"` and `alias.last "log -1 HEAD --stat"` save thousands of keystrokes.',
          'You can also enable helpful quality-of-life settings like `git config --global branch.sort -committerdate` (so `git branch` lists your most recently touched branches first instead of alphabetically).'
        ],
        keyTakeaways: [
          'Define global aliases via `git config --global alias.<shortcut> "<command>"`.',
          '`git lg` (`log --oneline --graph --decorate`) is the most popular visual history alias.',
          '`git config --global branch.sort -committerdate` orders `git branch` by recent activity.'
        ],
        commands: [
          {
            command: 'git config --global alias.lg "log --oneline --graph --decorate --all"',
            description: 'Create the `git lg` shortcut for a visual ASCII branch graph.'
          },
          {
            command: 'git config --global alias.st "status -sb"',
            description: 'Create `git st` for a compact branch + file status summary.'
          },
          {
            command: 'git config --global branch.sort -committerdate',
            description: 'Sort `git branch` output by most recently committed branch first.'
          }
        ],
        sandboxCommand: 'git config --global alias.lg "log --oneline --graph --decorate --all"',
        expectedOutput: `Registered global alias: git lg -> git log --oneline --graph --decorate --all\n* 92e1a4c (HEAD -> main, origin/main) fix(parser): handle empty JSON payload\n* 4b825dc feat(ui): add accessible aria-label\n✓ Alias ` + '`git lg`' + ` ready!`,
        commonPitfall: {
          title: 'Overriding Built-in Git Commands With Confusing Aliases',
          description:
            'Git purposely prevents aliases from overriding built-in Git subcommands (like `commit` or `push`), so pick short, distinct names like `st`, `co`, `lg`, and `unstage`.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which command creates a global Git alias so typing `git st` runs `git status -sb`?',
          options: [
            'git config --global alias.st "status -sb"',
            'git alias --create st="git status"',
            'git remote add st status',
            'git branch --alias st'
          ],
          correctOptionIndex: 0,
          hint: 'Aliases live under the `alias.<name>` key in `git config --global`.',
          explanation:
            '`git config --global alias.st "status -sb"` stores `st = status -sb` under the `[alias]` section of `~/.gitconfig`.'
        }
      }
    ]
  },
  {
    id: 'level-5',
    number: 5,
    title: 'Real-World Open Source Contribution Simulation',
    badge: 'Applied / Capstone',
    description:
      'Execute a complete end-to-end open-source contribution workflow from issue discovery to merged Pull Request, avoid critical disqualifying mistakes, and decode real CONTRIBUTING.md guides.',
    lessons: [
      {
        id: 'lesson-31',
        number: 31,
        levelId: 'level-5',
        title: 'End-to-End Simulation: Issue → Fork → Clone → Branch → Commit → Push → PR',
        duration: '10 min',
        summary:
          'Synthesize everything from Levels 1–4 into the complete 7-step open-source workflow connected directly to DevSync’s Issue Feed and Mentorship Explorer.',
        conceptParagraphs: [
          'You now have every foundational tool required to ship real open-source code. Let’s walk through the exact 7-step end-to-end engineering pipeline used on every issue in DevSync’s **Issue Feed** (`/feed`) and **505 Mentorship Organizations Explorer** (`/mentorship`):',
          '1. **Discover & Verify**: Pick a high skill-fit `good first issue` in DevSync’s Issue Feed, confirm it is unassigned, and open the **AI Onboarding Guide** to inspect its verified repository file tree.\n2. **Fork & Clone**: Fork the repository on GitHub to your account, clone your fork (`origin`), and add the official repo as `upstream`.\n3. **Sync & Branch**: Sync `main` with `upstream/main`, then create a focused branch (`git switch -c fix/issue-97-pause-refresh`).',
          '4. **Implement & Test**: Write the fix, run the project’s test suite (`npm test` / `pytest` / `cargo test`), and inspect your diff (`git diff`).\n5. **Stage & Commit**: Stage only the relevant files (`git add <file>`) and write a Conventional Commit (`git commit -m "fix: ..."`).\n6. **Push to Fork**: Push your branch (`git push -u origin fix/issue-97-pause-refresh`).\n7. **Open Pull Request**: Open the PR against `upstream/main` with `Closes #97` and your test verification checklist!'
        ],
        keyTakeaways: [
          'The 7-Step Pipeline: Find Issue → Fork & Clone → Sync & Branch → Code & Test → Stage & Commit → Push to Origin → Open PR (`Closes #ID`).',
          'Use DevSync’s Issue Feed (`/feed`) to match issues to your coursework stack and `/mentorship` to explore 505 GSoC organizations.',
          'Always run the repository’s local test suite before pushing your branch.'
        ],
        diagramType: 'pr-lifecycle',
        commands: [
          {
            command: 'git switch -c fix/issue-97-pause-refresh && git add src/table.ts && git commit -m "fix(table): pause polling when document is hidden (Closes #97)" && git push -u origin fix/issue-97-pause-refresh',
            description: 'Execute the complete branch, stage, commit, and push pipeline for Issue #97.'
          }
        ],
        sandboxCommand:
          'git switch -c fix/issue-97-pause-refresh && git add src/table.ts && git commit -m "fix(table): pause polling when document is hidden (Closes #97)" && git push -u origin fix/issue-97-pause-refresh',
        expectedOutput: `Switched to a new branch 'fix/issue-97-pause-refresh'\n[fix/issue-97-pause-refresh 89c4e12] fix(table): pause polling when document is hidden (Closes #97)\n 1 file changed, 14 insertions(+), 2 deletions(-)\nTo https://github.com/alex-rivera/shoal.git\n * [new branch]      fix/issue-97-pause-refresh -> fix/issue-97-pause-refresh\n✓ End-to-End Open-Source Pipeline Complete! Ready to submit PR on GitHub.`,
        commonPitfall: {
          title: 'Skipping Local Test Execution Before Opening the Pull Request',
          description:
            'Even a 3-line change can break an existing snapshot or unit test. Always run the project’s test runner locally before pushing so your first impression with the maintainer is a green CI build.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'What is the correct chronological order of the end-to-end open-source contribution pipeline?',
          options: [
            'Fork on GitHub → Clone fork (`origin`) & add `upstream` → Create feature branch (`git switch -c`) → Edit & run tests → Stage & Commit → Push to `origin` → Open PR targeting `upstream/main` with `Closes #ID`',
            'Clone `upstream` directly → Commit on `main` → Force-push to `upstream/main` → Open an Issue afterward',
            'Open an empty Pull Request first → Fork the repository → Run `git init` → Delete `.gitignore`',
            'Edit files on `main` → Run `git reset --hard` → Push tags to `upstream`'
          ],
          correctOptionIndex: 0,
          hint: 'Follow the Fork → Clone → Branch → Commit → Push to Origin → PR to Upstream sequence.',
          explanation:
            'Forking first, cloning your fork, branching off an up-to-date `main`, testing locally, committing cleanly, pushing to `origin`, and opening a PR to `upstream` is the universal open-source workflow.'
        }
      },
      {
        id: 'lesson-32',
        number: 32,
        levelId: 'level-5',
        title: 'Common Contribution Mistakes to Avoid',
        duration: '7 min',
        summary:
          'Learn the top 5 mistakes that cause Pull Requests to be rejected immediately—and how to prevent every single one.',
        conceptParagraphs: [
          'Maintainers across Google Summer of Code and Linux Foundation projects consistently cite five avoidable mistakes that cause beginner Pull Requests to be closed without merging:',
          '1. **Committing Secrets or `.env` Files**: Never hardcode API keys or commit `.env` files. Even if deleted in a later commit, bots scan public GitHub commit history in seconds.\n2. **Huge, Unfocused PRs (Formatting Noise)**: If your editor auto-formats 800 lines of untouched code while you fixed a 3-line bug, the reviewer cannot spot your actual change. Use `git diff` to verify only the target lines changed.\n3. **Force-Pushing to Shared Branches**: Never run `git push --force` on a branch someone else is collaborating on (if you must push a rebased personal branch, use `--force-with-lease`).\n4. **Submitting Unverified AI-Generated Spam PRs**: Never submit code you haven’t run, tested, and understood locally.\n5. **Ignoring Lockfiles or Adding Unrequested Dependencies**: Do not switch a repo from `pnpm` to `npm` or commit a `package-lock.json` in a `yarn` repository.'
        ],
        keyTakeaways: [
          'Always run `git diff` before committing to ensure auto-formatters did not rewrite hundreds of unrelated lines.',
          'Never commit `.env` files or API keys; use `.env.example` with blank placeholders.',
          'If updating a rebased personal PR branch, prefer `git push --force-with-lease` over `git push --force`.'
        ],
        commands: [
          {
            command: 'git diff --stat',
            description: 'Check how many files and lines your changes touch before staging.'
          },
          {
            command: 'git push --force-with-lease origin fix/issue-97-pause-refresh',
            description: 'Safely update a rebased feature branch only if no new upstream commits were added.'
          }
        ],
        sandboxCommand: 'git diff --stat',
        expectedOutput: ` src/table.ts | 16 ++++++++++++++--\n 1 file changed, 14 insertions(+), 2 deletions(-)\n✓ Clean, surgical diff verified: zero unintended formatting noise or lockfile churn!`,
        commonPitfall: {
          title: 'Running `npm install` in a Repository That Uses `pnpm` or `yarn`',
          description:
            'Look at the lockfile in the repository root (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`) to know which package manager the project uses. Never commit a second competing lockfile!'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'You fixed a 4-line bug, but when you run `git diff --stat`, you notice your code editor re-formatted 600 lines across 5 files. What should you do before opening a Pull Request?',
          options: [
            'Discard the unrelated formatting changes (or stage only your 4-line fix with `git add -p`) so the PR diff contains only the surgical bug fix',
            'Commit all 600 lines anyway and tell the maintainer their formatting was wrong',
            'Delete the repository’s `.prettierrc` and `.eslintrc` files',
            'Run `git push --force upstream main`'
          ],
          correctOptionIndex: 0,
          hint: 'Maintainers need a minimal, focused diff that only touches lines relevant to the issue.',
          explanation:
            'Keeping your diff surgical and focused on the exact issue (using `git add -p` or matching the repo’s formatter) makes your PR easy to review and safe to merge.'
        }
      },
      {
        id: 'lesson-33',
        number: 33,
        levelId: 'level-5',
        title: 'Reading a CONTRIBUTING.md File — What to Look For',
        duration: '7 min',
        summary:
          'Decode any repository’s CONTRIBUTING.md file to extract local setup commands, test suites, branch naming rules, and CLA requirements.',
        conceptParagraphs: [
          'Before writing a single line of code in a new repository, always read its `CONTRIBUTING.md` file (alongside `README.md`). DevSync’s **AI Onboarding Guide** automatically fetches and analyzes live `CONTRIBUTING.md` files for you, but knowing how to read them directly is a superpower.',
          'When scanning a `CONTRIBUTING.md`, look for five critical sections:\n1. **Prerequisites & Environment Setup**: Required Node/Python/Rust/Go versions, Docker services, or `.env.example` copy steps.\n2. **Package Manager & Build Commands**: How to install dependencies (`pnpm install`, `poetry install`) and compile the project.\n3. **Running Tests & Linters**: The exact command (`npm test`, `pytest -v`, `cargo clippy`) that CI will run on your PR.\n4. **Branch & Commit Conventions**: Whether the project requires Conventional Commits, changesets (`npx changeset`), or targeting a `develop` branch.\n5. **CLA / DCO Requirements**: Whether you must sign a Contributor License Agreement (CLA bot) or pass `-s` (`--signoff`) on commits.'
        ],
        keyTakeaways: [
          'Always check `CONTRIBUTING.md` for required runtime versions, package manager, and test commands.',
          'Check if the repo requires a changeset (`npx changeset`) or DCO sign-off (`git commit -s`).',
          'Following `CONTRIBUTING.md` to the letter signals to maintainers that you are a disciplined, trustworthy contributor.'
        ],
        commands: [
          {
            command: 'cat CONTRIBUTING.md | grep -E "test|install|branch|commit"',
            description: 'Quickly scan CONTRIBUTING.md for setup, testing, and commit conventions.'
          }
        ],
        sandboxCommand: 'cat CONTRIBUTING.md | grep -E "test|install|branch|commit"',
        expectedOutput: `1. Install dependencies using: pnpm install\n2. Create a feature branch from main: git switch -c feat/your-feature\n3. Run the unit test suite before committing: pnpm test\n4. Follow Conventional Commits (e.g., fix(scope): description) and sign DCO with git commit -s\n✓ CONTRIBUTING.md requirements extracted!`,
        commonPitfall: {
          title: 'Skipping `CONTRIBUTING.md` and Failing Automated Bot Checks',
          description:
            'Many repositories automatically close or block PRs that miss a required `changeset` file or DCO `--signoff`. Spending 3 minutes reading `CONTRIBUTING.md` saves hours of debugging CI failures.'
        },
        quiz: {
          type: 'multiple-choice',
          question:
            'Which key pieces of information should you always extract from a repository’s `CONTRIBUTING.md` before submitting your first Pull Request?',
          options: [
            'Required runtime/package manager setup, exact test & linter commands, target base branch, commit conventions, and CLA/DCO requirements',
            'Only the repository owner’s social media links',
            'Only the list of past release dates from 5 years ago',
            'Nothing—`CONTRIBUTING.md` is only for paid full-time employees'
          ],
          correctOptionIndex: 0,
          hint: 'Think about the 5 pillars of local setup, testing, conventions, and legal sign-off.',
          explanation:
            '`CONTRIBUTING.md` defines the exact environment setup, test commands, branch/commit conventions, and CLA/DCO steps expected of every contributor.'
        }
      }
    ]
  }
];

export const ALL_GIT_LESSONS: GitLesson[] = GIT_CURRICULUM_LEVELS.flatMap(
  (level) => level.lessons
);

export const FINAL_ASSESSMENT_QUESTIONS: FinalAssessmentQuestion[] = [
  {
    id: 'fa-1',
    levelNumber: 1,
    type: 'multiple-choice',
    question:
      'In Git’s Three-State Architecture, what is the role of the Staging Area (Index)?',
    options: [
      'It holds a draft snapshot of the exact changes you have selected via `git add` to be included in your next commit',
      'It stores files that are permanently ignored by `.gitignore`',
      'It automatically uploads your code to GitHub every 30 seconds',
      'It deletes untracked files from your hard drive'
    ],
    correctOptionIndex: 0,
    explanation:
      'The Staging Area (`.git/index`) sits between your Working Directory and the `.git` Repository, letting you craft clean, atomic commits.'
  },
  {
    id: 'fa-2',
    levelNumber: 1,
    type: 'command-input',
    question:
      'Write the Git command to inspect the exact line-by-line code differences that are currently STAGED in the Staging Area:',
    scenario:
      'You ran `git add src/index.ts` and want to review the staged diff before running `git commit`.',
    acceptedCommands: ['git diff --staged', 'git diff --cached'],
    placeholder: 'git diff ...',
    explanation:
      '`git diff --staged` (or `git diff --cached`) shows the diff between the Staging Area and your last commit.'
  },
  {
    id: 'fa-3',
    levelNumber: 1,
    type: 'multiple-choice',
    question:
      'Which commit message properly follows the Conventional Commits specification and imperative mood?',
    options: [
      'fix(auth): prevent session crash when OAuth cookie is missing',
      'Fixed a bug in auth yesterday',
      'updates to auth.ts and server.ts',
      'WIP trying to fix login'
    ],
    correctOptionIndex: 0,
    explanation:
      '`fix(auth): prevent session crash...` uses a valid type (`fix`), scope (`auth`), and imperative verb (`prevent`).'
  },
  {
    id: 'fa-4',
    levelNumber: 1,
    type: 'multiple-choice',
    question:
      'You accidentally committed a `.env` file earlier, then added `.env` to `.gitignore`, but Git still tracks modifications to `.env`. How do you untrack it from Git without deleting your local `.env` file?',
    options: [
      'git rm --cached .env',
      'git init --reset .env',
      'git clone --ignore .env',
      'git status --delete .env'
    ],
    correctOptionIndex: 0,
    explanation:
      '`git rm --cached .env` removes `.env` from Git’s Staging Index while preserving the physical file in your Working Directory.'
  },
  {
    id: 'fa-5',
    levelNumber: 2,
    type: 'command-input',
    question:
      'Write the Git command to create and immediately switch to a new branch named `feat/dark-mode`:',
    scenario:
      'You are on an up-to-date `main` branch and want to isolate your new feature work.',
    acceptedCommands: [
      'git switch -c feat/dark-mode',
      'git checkout -b feat/dark-mode'
    ],
    placeholder: 'git switch -c ...',
    explanation:
      'Both `git switch -c feat/dark-mode` and `git checkout -b feat/dark-mode` create the branch and switch `HEAD` to it.'
  },
  {
    id: 'fa-6',
    levelNumber: 2,
    type: 'multiple-choice',
    question:
      'While merging a branch, Git reports a merge conflict and inserts `<<<<<<< HEAD`, `=======`, and `>>>>>>> feat/ui` into `Navbar.tsx`. How do you properly resolve and complete the merge?',
    options: [
      'Edit `Navbar.tsx` to keep the desired code, delete all three conflict marker lines (`<<<<<<<`, `=======`, `>>>>>>>`), run `git add Navbar.tsx`, and run `git commit`',
      'Leave the `<<<<<<< HEAD` markers inside the file and push immediately to GitHub',
      'Delete the `.git` folder and re-initialize the repository',
      'Run `git init --force`'
    ],
    correctOptionIndex: 0,
    explanation:
      'Resolving a conflict requires editing the file to its final desired state, removing all conflict markers, staging with `git add`, and committing.'
  },
  {
    id: 'fa-7',
    levelNumber: 2,
    type: 'multiple-choice',
    question:
      'What is the "Golden Rule of Rebasing" (`git rebase`)?',
    options: [
      'Never rebase a shared public branch (like `main`) that other developers have already pulled and based work on',
      'Never run `git rebase` on your own private local feature branch',
      'Always rebase before running `git init`',
      'Rebasing only works on files ignored by `.gitignore`'
    ],
    correctOptionIndex: 0,
    explanation:
      'Because `git rebase` rewrites commit SHAs, rebasing a shared public branch forces teammates to reconcile divergent duplicate histories.'
  },
  {
    id: 'fa-8',
    levelNumber: 2,
    type: 'command-input',
    question:
      'You stashed uncommitted changes earlier with `git stash`. Write the command to reapply the latest stashed changes to your working tree and remove them from the stash stack:',
    acceptedCommands: ['git stash pop'],
    placeholder: 'git stash ...',
    explanation:
      '`git stash pop` restores the top stash entry (`stash@{0}`) and drops it from the stash stack.'
  },
  {
    id: 'fa-9',
    levelNumber: 2,
    type: 'multiple-choice',
    question:
      'What is the key difference between `git reset --soft HEAD~1` and `git revert <commit-sha>`?',
    options: [
      '`git reset --soft HEAD~1` moves the local branch pointer back one commit while keeping changes staged (rewriting local history), whereas `git revert` creates a brand-new commit that safely reverses a previous commit without rewriting shared history',
      '`git revert` deletes your entire working directory, while `git reset --soft` pushes to GitHub',
      'They do the exact same thing',
      '`git reset --soft` only works on remote repositories'
    ],
    correctOptionIndex: 0,
    explanation:
      '`git reset` moves branch pointers backward (for local cleanup), whereas `git revert` records a new inverse commit (safe for shared branches).'
  },
  {
    id: 'fa-10',
    levelNumber: 3,
    type: 'multiple-choice',
    question:
      'In the standard open-source Fork & Upstream triangle workflow, what do the `origin` and `upstream` remotes point to?',
    options: [
      '`origin` points to your personal fork on GitHub (where you push feature branches); `upstream` points to the official parent repository (where you fetch community updates)',
      '`origin` points to the official parent repository; `upstream` points to your local hard drive',
      'Both `origin` and `upstream` must point to the exact same URL',
      '`upstream` is only used for deleting branches'
    ],
    correctOptionIndex: 0,
    explanation:
      '`origin` is your personal GitHub fork where you have write permissions, and `upstream` is the official maintainer repository.'
  },
  {
    id: 'fa-11',
    levelNumber: 3,
    type: 'command-input',
    question:
      'Write the Git command to register the official parent repository `https://github.com/org/repo.git` as a remote named `upstream`:',
    acceptedCommands: [
      'git remote add upstream https://github.com/org/repo.git'
    ],
    placeholder: 'git remote add ...',
    explanation:
      '`git remote add upstream https://github.com/org/repo.git` links the parent repository under the `upstream` alias.'
  },
  {
    id: 'fa-12',
    levelNumber: 3,
    type: 'multiple-choice',
    question:
      'After you open a Pull Request, a maintainer reviews your code and asks for a small change. What is the right way to update your Pull Request?',
    options: [
      'Make the edits on the same local feature branch, create a new commit, and run `git push origin <your-branch>`—GitHub updates the open PR automatically',
      'Close the Pull Request, delete your branch, and open a brand-new Pull Request',
      'Push directly to `upstream/main`',
      'Open a new GitHub Issue pasting the updated code'
    ],
    correctOptionIndex: 0,
    explanation:
      'Pushing additional commits to the same branch on `origin` automatically updates the open Pull Request while preserving all review discussions.'
  },
  {
    id: 'fa-13',
    levelNumber: 3,
    type: 'multiple-choice',
    question:
      'What happens when you include `Closes #215` in the description body of your Pull Request?',
    options: [
      'GitHub links your Pull Request to Issue #215 and automatically closes Issue #215 the moment your PR is merged into the default branch',
      'GitHub immediately closes your Pull Request without merging it',
      'GitHub deletes Issue #215 before anyone can review your code',
      'Nothing; `#215` is ignored by GitHub'
    ],
    correctOptionIndex: 0,
    explanation:
      'Keywords like `Closes #215`, `Fixes #215`, and `Resolves #215` link the PR and auto-close the issue when merged.'
  },
  {
    id: 'fa-14',
    levelNumber: 4,
    type: 'multiple-choice',
    question:
      'You accidentally committed a bugfix on an experimental branch (`exp/test`) and want to copy ONLY that single commit (`a4f91c2`) onto your clean `fix/bug` branch without merging the rest of `exp/test`. Which command should you run on `fix/bug`?',
    options: [
      'git cherry-pick a4f91c2',
      'git merge --all exp/test',
      'git submodule add a4f91c2',
      'git tag -a a4f91c2'
    ],
    correctOptionIndex: 0,
    explanation:
      '`git cherry-pick a4f91c2` applies the exact diff of commit `a4f91c2` onto your current branch as a new commit.'
  },
  {
    id: 'fa-15',
    levelNumber: 4,
    type: 'multiple-choice',
    question:
      'Under Semantic Versioning (`MAJOR.MINOR.PATCH`), what version bump is required when a release introduces a backward-incompatible breaking API change to `v1.8.4`?',
    options: [
      'v2.0.0 (increment MAJOR and reset MINOR and PATCH to 0)',
      'v1.9.0 (increment MINOR)',
      'v1.8.5 (increment PATCH)',
      'v1.8.4-beta'
    ],
    correctOptionIndex: 0,
    explanation:
      'Breaking API changes require incrementing the `MAJOR` version number and resetting `MINOR` and `PATCH` to `0` (`v2.0.0`).'
  },
  {
    id: 'fa-16',
    levelNumber: 4,
    type: 'multiple-choice',
    question:
      'What is the purpose of a `pre-commit` Git hook in an open-source repository?',
    options: [
      'To automatically run linters, formatters, or type checks on staged files before a commit is finalized, blocking broken commits locally',
      'To delete `.gitignore` before every commit',
      'To bypass GitHub branch protection rules on `main`',
      'To automatically merge Pull Requests without maintainer review'
    ],
    correctOptionIndex: 0,
    explanation:
      '`pre-commit` hooks validate staged code locally before the commit is created, catching lint and type errors early.'
  },
  {
    id: 'fa-17',
    levelNumber: 5,
    type: 'multiple-choice',
    question:
      'You clone an open-source repository that contains a `pnpm-lock.yaml` file in its root directory. Which practice should you follow when installing dependencies and submitting your PR?',
    options: [
      'Use `pnpm` as specified in `CONTRIBUTING.md` and never commit a competing `package-lock.json` or `yarn.lock` file',
      'Delete `pnpm-lock.yaml` and run `npm install` instead',
      'Reformat every file in the repository so your PR touches 100+ files',
      'Commit your local `.env` file so CI can read your personal API keys'
    ],
    correctOptionIndex: 0,
    explanation:
      'Always respect the repository’s existing package manager and lockfile (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`) and keep diffs surgical.'
  },
  {
    id: 'fa-18',
    levelNumber: 5,
    type: 'multiple-choice',
    question:
      'Why should you prefer `git push --force-with-lease` over `git push --force` when updating a rebased personal feature branch?',
    options: [
      '`--force-with-lease` checks that the remote branch has not received any new commits from collaborators (or maintainers) since your last fetch, preventing you from accidentally overwriting someone else’s work',
      '`--force-with-lease` bypasses all unit tests in GitHub Actions',
      '`--force-with-lease` pushes directly to `upstream/main` without a Pull Request',
      '`--force-with-lease` deletes all other branches in the repository'
    ],
    correctOptionIndex: 0,
    explanation:
      '`--force-with-lease` refuses to overwrite the remote branch if its tip has changed since you last fetched, protecting against accidental data loss.'
  }
];

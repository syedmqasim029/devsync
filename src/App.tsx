import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams
} from 'react-router-dom';
import { StudentProfile, GitHubIssue } from './types';
import {
  DEFAULT_STUDENT_PROFILE,
  normalizeStudentProfile
} from './constants/skills';
import { MOCK_GITHUB_ISSUES } from './data/mockIssues';
import { calculateIssueMatch } from './utils/matchingEngine';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Dashboard } from './components/Dashboard';
import { GuidedIssueModal } from './components/GuidedIssueModal';
import { LearnGitModule } from './components/LearnGitModule';
import { MentorshipExplorer } from './components/MentorshipExplorer';
import { AuthModal } from './components/AuthModal';
import { PortfolioView } from './components/PortfolioView';
import { Footer } from './components/Footer';

const STORAGE_KEY_PROFILE = 'devsync_student_profile_v1';
const STORAGE_KEY_LEGACY_PROFILE = 'devsync_user_profile_v2';
const STORAGE_KEY_CHECKLIST = 'devsync_issue_checklists_v1';
const STORAGE_KEY_SAVED_ISSUES = 'devsync_saved_issues_v1';

interface PortfolioRouteWrapperProps {
  profile: StudentProfile;
  savedIssues: GitHubIssue[];
  onSelectIssue: (issue: GitHubIssue) => void;
}

const PortfolioRouteWrapper: React.FC<PortfolioRouteWrapperProps> = ({
  profile,
  savedIssues,
  onSelectIssue
}) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  return (
    <PortfolioView
      username={username || profile.githubUsername || 'torvalds'}
      profile={profile}
      savedIssues={savedIssues}
      onSelectIssue={onSelectIssue}
      onBack={() => navigate('/feed')}
    />
  );
};

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_PROFILE) ||
        localStorage.getItem(STORAGE_KEY_LEGACY_PROFILE);
      if (saved) {
        return normalizeStudentProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load profile from localStorage', e);
    }
    return DEFAULT_STUDENT_PROFILE;
  });

  const [checklists, setChecklists] = useState<Record<string, boolean[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKLIST);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load checklists from localStorage', e);
    }
    return {};
  });

  const [savedIssues, setSavedIssues] = useState<GitHubIssue[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_ISSUES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved issues from localStorage', e);
    }
    return [];
  });

  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync server-side OAuth session on load
  useEffect(() => {
    let isMounted = true;
    const checkSessionStatus = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (authRes.ok && isMounted) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user?.login) {
            setProfile((prev) =>
              normalizeStudentProfile({
                ...prev,
                name: authData.user.name || prev.name,
                githubUsername: authData.user.login
              })
            );
          }
        }
      } catch {
        // Silent ignore when unauthenticated
      }
    };
    checkSessionStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save profile changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  }, [profile]);

  // Save checklists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(checklists));
    } catch (e) {
      console.error('Failed to save checklists to localStorage', e);
    }
  }, [checklists]);

  // Save bookmarked issues to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_ISSUES, JSON.stringify(savedIssues));
    } catch (e) {
      console.error('Failed to save bookmarked issues to localStorage', e);
    }
  }, [savedIssues]);

  const savedIssueIds = useMemo(
    () => new Set(savedIssues.map((i) => i.id)),
    [savedIssues]
  );

  const handleToggleSaveIssue = useCallback(
    (issue: GitHubIssue) => {
      setSavedIssues((prev) => {
        const exists = prev.some((item) => item.id === issue.id);
        if (exists) {
          return prev.filter((item) => item.id !== issue.id);
        }
        const scored = issue.matchBreakdown ? issue : calculateIssueMatch(issue, profile);
        return [scored, ...prev];
      });
    },
    [profile]
  );

  // Deep-link support for ?issue=<id>
  useEffect(() => {
    const issueIdParam = searchParams.get('issue');
    if (issueIdParam && !selectedIssue) {
      const matchedSaved = savedIssues.find(
        (i) => i.id === issueIdParam || String(i.number) === issueIdParam
      );
      const matchedMock = MOCK_GITHUB_ISSUES.find(
        (i) => i.id === issueIdParam || String(i.number) === issueIdParam
      );
      const found = matchedSaved || matchedMock;
      if (found) {
        setSelectedIssue(calculateIssueMatch(found, profile));
      }
    }
  }, [searchParams, selectedIssue, profile, savedIssues]);

  // Live GitHub Issues State
  const [issues, setIssues] = useState<GitHubIssue[]>(MOCK_GITHUB_ISSUES);
  const [isLoadingIssues, setIsLoadingIssues] = useState<boolean>(false);
  const [isLiveGitHubData, setIsLiveGitHubData] = useState<boolean>(false);

  const fetchGitHubIssues = useCallback(async (languageFilter: string = 'All') => {
    setIsLoadingIssues(true);
    try {
      const response = await fetch(`/api/github/issues?language=${encodeURIComponent(languageFilter)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch from backend');
      const data = await response.json();
      if (data.issues && Array.isArray(data.issues) && data.issues.length > 0) {
        setIssues(data.issues);
        setIsLiveGitHubData(!data.isFallback);
      } else {
        setIssues(MOCK_GITHUB_ISSUES);
        setIsLiveGitHubData(false);
      }
    } catch (error) {
      console.warn('Error fetching live GitHub issues, using curated dataset:', error);
      setIssues(MOCK_GITHUB_ISSUES);
      setIsLiveGitHubData(false);
    } finally {
      setIsLoadingIssues(false);
    }
  }, []);

  const profileLanguages =
    profile?.skills?.languages ?? DEFAULT_STUDENT_PROFILE.skills.languages;

  useEffect(() => {
    const primaryLang = profileLanguages[0] || 'All';
    fetchGitHubIssues(primaryLang);
  }, [fetchGitHubIssues, profileLanguages]);

  const handleOnboardingComplete = (updatedProfile: StudentProfile) => {
    setProfile(normalizeStudentProfile(updatedProfile));
    navigate('/feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleChecklistStep = (issueId: string, stepIndex: number) => {
    setChecklists((prev) => {
      const current = prev[issueId] || [false, false, false, false, false];
      const updated = [...current];
      updated[stepIndex] = !updated[stepIndex];
      return {
        ...prev,
        [issueId]: updated
      };
    });
  };

  const handleSelectIssue = (issue: GitHubIssue) => {
    const scored = issue.matchBreakdown ? issue : calculateIssueMatch(issue, profile);
    setSelectedIssue(scored);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('issue', issue.id);
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseIssueModal = () => {
    setSelectedIssue(null);
    if (searchParams.has('issue')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('issue');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleAuthSuccess = (userData: { name: string; email: string; githubUsername?: string }) => {
    setProfile((prev) =>
      normalizeStudentProfile({
        ...prev,
        name: userData.name || prev.name,
        githubUsername: userData.githubUsername || prev.githubUsername,
        hasCompletedOnboarding: true
      })
    );
    if (location.pathname === '/') {
      navigate('/feed');
    }
  };

  const portfolioTargetHandle = profile.githubUsername || 'torvalds';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A] selection:bg-blue-600 selection:text-white">
      <Navbar
        profile={profile}
        savedCount={savedIssues.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HeroLanding
                onStartOnboarding={() => navigate('/onboarding')}
                onExploreDashboard={() => navigate('/feed')}
                onExploreMentorship={() => navigate('/mentorship')}
                hasCompletedOnboarding={profile.hasCompletedOnboarding}
              />
            }
          />

          <Route
            path="/onboarding"
            element={
              <OnboardingWizard
                initialProfile={profile}
                onComplete={handleOnboardingComplete}
                onCancel={() => navigate(profile.hasCompletedOnboarding ? '/feed' : '/')}
              />
            }
          />

          <Route
            path="/feed"
            element={
              <Dashboard
                profile={profile}
                issues={issues}
                savedIssues={savedIssues}
                savedIssueIds={savedIssueIds}
                onToggleSaveIssue={handleToggleSaveIssue}
                isLoadingIssues={isLoadingIssues}
                isLiveGitHubData={isLiveGitHubData}
                onRefreshIssues={fetchGitHubIssues}
                onSelectIssue={handleSelectIssue}
                onEditProfile={() => navigate('/onboarding')}
                onUpdateProfile={(updated) =>
                  setProfile(normalizeStudentProfile(updated))
                }
                onOpenPortfolio={() =>
                  navigate(`/portfolio/${encodeURIComponent(portfolioTargetHandle)}`)
                }
              />
            }
          />

          <Route
            path="/mentorship"
            element={
              <MentorshipExplorer
                profile={profile}
                savedIssueIds={savedIssueIds}
                onToggleSaveIssue={handleToggleSaveIssue}
                onSelectIssue={handleSelectIssue}
              />
            }
          />

          <Route
            path="/learn"
            element={
              <LearnGitModule
                profile={profile}
                onBackToDashboard={() => navigate('/feed')}
                onExploreMentorship={() => navigate('/mentorship')}
                onOpenPortfolio={() =>
                  navigate(`/portfolio/${encodeURIComponent(portfolioTargetHandle)}`)
                }
              />
            }
          />

          <Route
            path="/portfolio/:username"
            element={
              <PortfolioRouteWrapper
                profile={profile}
                savedIssues={savedIssues}
                onSelectIssue={handleSelectIssue}
              />
            }
          />

          {/* Redirect legacy /upgrade URL to /feed since all features are 100% free */}
          <Route path="/upgrade" element={<Navigate to="/feed" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {selectedIssue && (
        <GuidedIssueModal
          issue={selectedIssue}
          profile={profile}
          isSaved={savedIssueIds.has(selectedIssue.id)}
          onToggleSave={() => handleToggleSaveIssue(selectedIssue)}
          onClose={handleCloseIssueModal}
          completedSteps={
            checklists[selectedIssue.id] || [false, false, false, false, false]
          }
          onToggleStep={(index) =>
            handleToggleChecklistStep(selectedIssue.id, index)
          }
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <Footer />
    </div>
  );
}

export default App;

import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Terminal,
  BookOpen,
  UserCheck,
  Sparkles,
  Compass,
  Award,
  LogIn,
  Bookmark
} from 'lucide-react';
import { StudentProfile } from '../types';

interface NavbarProps {
  profile: StudentProfile;
  savedCount: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  savedCount,
  onOpenAuth
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
        : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-slate-100 border border-transparent'
    }`;

  const portfolioTarget = `/portfolio/${encodeURIComponent(
    profile.githubUsername || 'torvalds'
  )}`;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
        {/* Zone 1: Brand Anchor */}
        <div
          onClick={() => navigate('/')}
          className="order-1 flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight text-[#0A0A0A]">
                Dev<span className="text-blue-600">Sync</span>
              </span>
              <span className="hidden xl:inline-block text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                Open-Source Onboarding
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Primary Navigation */}
        <nav className="order-3 md:order-2 w-full md:w-auto flex items-center justify-between md:justify-center gap-1 sm:gap-1.5 overflow-x-auto border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 mt-1 md:mt-0">
          <NavLink to="/" end className={navLinkClass}>
            Overview
          </NavLink>

          <NavLink to="/feed" className={navLinkClass}>
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="whitespace-nowrap">Issue Feed</span>
            {savedCount > 0 && (
              <span
                title={`${savedCount} saved issue${savedCount === 1 ? '' : 's'}`}
                className="ml-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-mono font-bold tabular-nums flex items-center gap-0.5"
              >
                <Bookmark className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                {savedCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/mentorship" className={navLinkClass}>
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Mentorship Orgs</span>
            <span className="md:hidden">Orgs</span>
          </NavLink>

          <NavLink to="/learn" className={navLinkClass}>
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Git</span>
            <span className="hidden sm:inline whitespace-nowrap">Guide</span>
          </NavLink>

          <NavLink to={portfolioTarget} className={navLinkClass}>
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">Portfolio</span>
          </NavLink>
        </nav>

        {/* Zone 3: User Profile & Actions */}
        <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/onboarding')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-display font-semibold border transition-all cursor-pointer ${
              location.pathname === '/onboarding'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : profile.hasCompletedOnboarding
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-[#0A0A0A]'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs'
            }`}
          >
            {profile.hasCompletedOnboarding ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline font-semibold text-[#0A0A0A]">
                  {profile.githubUsername ? `@${profile.githubUsername}` : profile.name.split(' ')[0]}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold tabular-nums">
                  {(profile?.skills?.languages?.length ?? 0) +
                    (profile?.skills?.frameworks?.length ?? 0)}{' '}
                  skills
                </span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span className="whitespace-nowrap">Match My Skills</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-display font-semibold border transition-colors cursor-pointer ${
              profile.githubUsername
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-100 text-[#0A0A0A] border-slate-300'
            }`}
            title="Connect GitHub Account"
          >
            <LogIn className={`w-4 h-4 ${profile.githubUsername ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span className="hidden md:inline whitespace-nowrap">
              {profile.githubUsername ? 'GitHub Connected' : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

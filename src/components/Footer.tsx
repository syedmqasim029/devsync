import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Github, Heart, ShieldCheck, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-extrabold text-[#0A0A0A] tracking-tight text-base">
                Dev<span className="text-blue-600">Sync</span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% Free for Students
              </span>
            </div>
            <p className="text-xs text-slate-700 max-w-md leading-relaxed">
              Open-source contribution discovery, repository onboarding, and GSoC/LFX mentorship directory built for university computer science students and first-time contributors.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-3">
              Platform Modules
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/feed" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Issue Feed &amp; Profile Analyzer
                </Link>
              </li>
              <li>
                <Link to="/mentorship" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  505 Mentorship Organizations
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Interactive Git &amp; PR Guide
                </Link>
              </li>
              <li>
                <Link to="/portfolio/torvalds" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Public Contributor Portfolio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-3">
              Engineering Standards
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
                <span>Live GitHub REST &amp; GraphQL APIs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Grounded Repository Context Analysis</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>AES-256-GCM Encrypted OAuth Sessions</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
            <span>for university developers entering open source</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} DevSync Open-Source Onboarding Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

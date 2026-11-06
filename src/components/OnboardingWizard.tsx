import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Code2,
  Layers,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '../types';
import { AVAILABLE_LANGUAGES, AVAILABLE_FRAMEWORKS } from '../constants/skills';

interface OnboardingWizardProps {
  initialProfile: StudentProfile;
  onComplete: (profile: StudentProfile) => void;
  onCancel: () => void;
}

const EXPERIENCE_LEVELS: Array<{
  level: StudentProfile['experienceLevel'];
  desc: string;
}> = [
  {
    level: 'First-Time Contributor',
    desc: 'I have built university coursework or personal projects, but never opened a Pull Request on a public repository.'
  },
  {
    level: 'Familiar with Git',
    desc: 'I understand branches, commits, and merges, and want a clear beginner or intermediate issue.'
  },
  {
    level: 'Active Open-Source Contributor',
    desc: 'I have merged PRs before and want high-impact issues matching my technical stack.'
  }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState(initialProfile.name);
  const [university, setUniversity] = useState(initialProfile.university);
  const [degree, setDegree] = useState(initialProfile.degree);
  const [experienceLevel, setExperienceLevel] = useState<
    StudentProfile['experienceLevel']
  >(initialProfile.experienceLevel);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialProfile?.skills?.languages ?? ['TypeScript']
  );
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(
    initialProfile?.skills?.frameworks ?? []
  );

  const toggleItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = () => {
    const updated: StudentProfile = {
      ...initialProfile,
      name: name.trim() || 'Student Developer',
      university: university.trim() || 'University CS Program',
      degree: degree.trim() || 'B.S. in Computer Science',
      experienceLevel,
      skills: {
        languages:
          selectedLanguages.length > 0 ? selectedLanguages : ['TypeScript'],
        frameworks: selectedFrameworks
      },
      hasCompletedOnboarding: true
    };
    onComplete(updated);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all ${
                  s === step
                    ? 'w-10 bg-blue-600'
                    : s < step
                    ? 'w-6 bg-emerald-600'
                    : 'w-6 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: Academic Profile & Experience */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-700 text-xs font-display font-bold uppercase tracking-wider mb-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Academic &amp; Git Background</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Tell us about your student background
              </h2>
              <p className="text-slate-700 text-sm mt-1">
                We use this to calibrate issue complexity and onboarding instructions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0A0A0A] text-sm focus:outline-none focus:border-blue-600"
                  placeholder="e.g., Alex Rivera"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  University / Institution
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0A0A0A] text-sm focus:outline-none focus:border-blue-600"
                  placeholder="e.g., State University"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-2">
                Open-Source Experience Level
              </label>
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((item) => {
                  const isSelected = experienceLevel === item.level;
                  return (
                    <div
                      key={item.level}
                      onClick={() => setExperienceLevel(item.level)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 text-[#0A0A0A] shadow-2xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-[#0A0A0A]">{item.level}</div>
                        <div className="text-xs text-slate-700 mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Programming Languages */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-700 text-xs font-display font-bold uppercase tracking-wider mb-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>Coursework Languages</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Which programming languages do you know?
              </h2>
              <p className="text-slate-700 text-sm mt-1">
                Select the languages you&apos;ve used in university assignments or personal projects.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      toggleItem(lang, selectedLanguages, setSelectedLanguages)
                    }
                    className={`p-3.5 rounded-xl border text-left font-display font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-[#0A0A0A] shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-[#0A0A0A]'
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Frameworks & Tools */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-display font-bold uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Frameworks &amp; Tooling</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Select frameworks or tools you&apos;ve explored
              </h2>
              <p className="text-slate-700 text-sm mt-1">
                Even basic familiarity helps our heuristic matching engine rank issues that fit your environment.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_FRAMEWORKS.map((fw) => {
                const isSelected = selectedFrameworks.includes(fw);
                return (
                  <button
                    key={fw}
                    type="button"
                    onClick={() =>
                      toggleItem(fw, selectedFrameworks, setSelectedFrameworks)
                    }
                    className={`p-3.5 rounded-xl border text-left font-display font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-[#0A0A0A] shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-[#0A0A0A]'
                    }`}
                  >
                    <span>{fw}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[40px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-sm font-display font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[40px] px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 text-sm font-display font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="min-h-[40px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[40px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Matching Issues</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

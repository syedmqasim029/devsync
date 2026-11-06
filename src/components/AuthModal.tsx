import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; githubUsername?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [githubHandle, setGithubHandle] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Listen for OAuth Popup Callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsLoading(true);
        setError(null);
        setOauthNotice(null);
        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'include' });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.authenticated && meData.user) {
              setSuccessMessage(`Connected as @${meData.user.login}`);
              setTimeout(() => {
                onSuccess({
                  name: meData.user.name || meData.user.login,
                  email: `${meData.user.login}@users.noreply.github.com`,
                  githubUsername: meData.user.login
                });
                setIsLoading(false);
                setSuccessMessage(null);
                onClose();
              }, 700);
              return;
            }
          }
        } catch {
          // Fall through to error message
        }
        setIsLoading(false);
        setError('GitHub OAuth completed, but session verification failed. Please try again.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onClose]);

  if (!isOpen) return null;

  const handleGitHubOAuth = async () => {
    setIsLoading(true);
    setError(null);
    setOauthNotice(null);
    try {
      const response = await fetch('/api/auth/url', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || data.isMock || !data.url) {
        setIsLoading(false);
        setOauthNotice(
          data.error ||
            'GitHub OAuth client credentials (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET) are not configured on this server. You can bind your public GitHub username below or analyze any GitHub profile directly in the Issue Feed.'
        );
        return;
      }

      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
        setIsLoading(false);
      }
    } catch {
      setError('Failed to initiate GitHub OAuth flow.');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOauthNotice(null);

    if (!email.includes('@')) {
      setError('Please enter a valid student or developer email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const cleanedHandle = githubHandle
      .trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .trim();

    setIsLoading(true);
    setSuccessMessage(
      mode === 'login' ? 'Local profile loaded!' : 'Local student profile saved!'
    );

    setTimeout(() => {
      onSuccess({
        name: name.trim() || email.split('@')[0],
        email,
        githubUsername: cleanedHandle || undefined
      });
      setIsLoading(false);
      setSuccessMessage(null);
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 id="auth-modal-title" className="font-display text-lg font-extrabold text-[#0A0A0A]">
              {mode === 'login' ? 'Connect Your Developer Profile' : 'Create Student Profile'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Sign in with GitHub OAuth or save your local student profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close modal"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-white">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-xs text-red-900 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {oauthNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block mb-0.5">
                  Server OAuth Credentials Not Configured
                </span>
                {oauthNotice}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={handleGitHubOAuth}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-slate-800 border border-slate-900 text-white font-display font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            <span>Continue with GitHub OAuth</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-600 font-display font-bold">
              Or save local profile
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Local Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Public GitHub Username (Optional)
              </label>
              <div className="relative">
                <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  placeholder="e.g., torvalds or gvanrossum"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                University or Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-[#0A0A0A] placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{mode === 'login' ? 'Save & Continue' : 'Create Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-700">
          {mode === 'login' ? (
            <>
              New to DevSync?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                Create a student profile
              </button>
            </>
          ) : (
            <>
              Already have a profile?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useAuth, type AuthModalMode } from '../../context/AuthContext';
import { ShinyButton } from '@/registry/magicui/shiny-button';
import { InteractiveHoverButton } from '@/registry/magicui/interactive-hover-button';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    closeAuthModal, 
    openAuthModal, 
    login, 
    register, 
    resetPassword,
    isFirebaseActive 
  } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleModeSwitch = (mode: AuthModalMode) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    openAuthModal(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else if (authModalMode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter your password.');
        }
        await register(email, name, password);
      } else if (authModalMode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset instructions have been dispatched to your email address.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected authentication error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@shiplink.in');
    setPassword('Admin@2026');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 transition-colors duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-100/60 dark:bg-sky-950/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{isFirebaseActive ? 'Google Firebase Auth' : 'Firebase Identity Layer'}</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SQL-Injection Immune
          </span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {authModalMode === 'login' && 'Sign In to ShipLink'}
            {authModalMode === 'register' && 'Register Maritime Account'}
            {authModalMode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authModalMode === 'login' && 'Access physical BDI market telemetry and 14-day ML forecast models.'}
            {authModalMode === 'register' && 'Create your authorized operator profile for dry bulk logistics.'}
            {authModalMode === 'forgot' && 'Enter your verified email to receive a secure password reset link.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Field (Register Mode Only) */}
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name / Organization
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Capt. Rajesh V. (SAIL Logistics)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email ID Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="charterer@shiplink.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Password Field (Login & Register Mode) */}
          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field (Register Mode Only) */}
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-sky-500 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-sky-500'
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          {authModalMode === 'login' ? (
            <ShinyButton
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 shadow-sky-600/30 text-xs sm:text-sm"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </ShinyButton>
          ) : (
            <InteractiveHoverButton
              type="submit"
              disabled={isLoading || (authModalMode === 'register' && password !== confirmPassword)}
              className="w-full py-3 mt-2 border-sky-400/50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-slate-900 dark:border-white/30 dark:border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {authModalMode === 'register' && 'Create Account & Launch'}
                  {authModalMode === 'forgot' && 'Dispatch Reset Link'}
                </>
              )}
            </InteractiveHoverButton>
          )}
        </form>

        {/* Demo Credentials Fast-Fill */}
        {authModalMode === 'login' && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Evaluation Mode:
            </span>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Fill Demo Credentials
            </button>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          {authModalMode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors cursor-pointer"
              >
                Register now
              </button>
            </p>
          )}

          {authModalMode === 'register' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}

          {authModalMode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

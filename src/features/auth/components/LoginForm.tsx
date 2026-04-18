import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';

type AuthMode = 'signin' | 'signup' | 'reset';

export const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/scenarios';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, 'error');
      } else {
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Account created! Please check your email to confirm.', 'success');
        setMode('signin');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'info');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast('Password reset email sent! Check your inbox.', 'success');
      setMode('signin');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2.5 outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-tertiary)]';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-primary)] opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--accent-secondary)] opacity-5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-8 z-10">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-[var(--accent-primary)] mb-4 p-3 bg-[var(--accent-primary)] bg-opacity-10 rounded-xl">
            <Activity size={36} />
          </div>
          <h1 className="font-display text-2xl tracking-tight">ArthaGraph</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm text-center">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create a new account'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Mode tabs */}
        {mode !== 'reset' && (
          <div className="flex bg-[var(--bg-surface-2)] rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] shadow'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Google OAuth */}
        {mode !== 'reset' && (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-100 mb-6 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
            </button>

            <div className="flex items-center mb-6">
              <div className="flex-grow h-px bg-[var(--border-strong)]" />
              <span className="px-3 text-[var(--text-tertiary)] text-xs uppercase tracking-widest">or</span>
              <div className="flex-grow h-px bg-[var(--border-strong)]" />
            </div>
          </>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="analyst@antigravity.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-[var(--accent-primary)]" />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-sm text-[var(--accent-secondary)] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-semibold py-2.5 rounded-lg mt-2 hover:bg-opacity-90 transition-all flex justify-center items-center h-11 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="analyst@antigravity.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-[var(--negative)]'
                      : confirmPassword && confirmPassword === password
                      ? 'border-[var(--positive)]'
                      : ''
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-[var(--negative)] mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password strength indicator */}
            <div className="flex gap-1 h-1">
              {[8, 12, 16].map((threshold, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    password.length >= threshold
                      ? i === 0
                        ? 'bg-[var(--negative)]'
                        : i === 1
                        ? 'bg-yellow-400'
                        : 'bg-[var(--positive)]'
                      : 'bg-[var(--border-strong)]'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] -mt-2">
              {password.length === 0 ? 'Enter a password' : password.length < 8 ? 'Too short' : password.length < 12 ? 'Fair' : password.length < 16 ? 'Good' : 'Strong'}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-semibold py-2.5 rounded-lg mt-2 hover:bg-opacity-90 transition-all flex justify-center items-center h-11 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>

            <p className="text-xs text-center text-[var(--text-tertiary)]">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)] text-center mb-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="analyst@antigravity.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-semibold py-2.5 rounded-lg hover:bg-opacity-90 transition-all flex justify-center items-center h-11 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-sm text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

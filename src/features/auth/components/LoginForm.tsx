import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { Activity, Loader2 } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/scenarios';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showToast('Please enter your email to reset password', 'info');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showToast('Password reset email sent!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Subtle grid background texture */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="text-[var(--accent-primary)] mb-4">
            <Activity size={48} />
          </div>
          <h1 className="font-display text-section-header tracking-tight">Antigravity AVS</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-center">Sign in to Antigravity Valuation Suite</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-2.5 px-4 rounded transition-colors hover:bg-gray-100 mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-grow h-px bg-[var(--border-strong)]"></div>
          <span className="px-3 text-[var(--text-tertiary)] text-label uppercase tracking-widest">or</span>
          <div className="flex-grow h-px bg-[var(--border-strong)]"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-label text-[var(--text-secondary)] mb-1">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="analyst@antigravity.com"
            />
          </div>
          <div>
            <label className="block text-label text-[var(--text-secondary)] mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[var(--accent-primary)]" />
              <span className="text-label text-[var(--text-secondary)]">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={handleResetPassword}
              className="text-label text-[var(--accent-secondary)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-medium py-2.5 rounded mt-4 hover:bg-opacity-90 transition-all flex justify-center items-center h-11"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-label text-[var(--text-tertiary)]">
          Access is by invitation only. Contact your administrator.
        </p>
      </div>
    </div>
  );
};

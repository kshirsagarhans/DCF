import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAppStore } from '../../../store';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, setSession, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      if (!session) {
        navigate('/login', { state: { from: location }, replace: true });
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (!session && location.pathname !== '/login') {
        navigate('/login', { state: { from: location }, replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, setSession, setUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
      </div>
    );
  }

  return session ? <>{children}</> : null;
};

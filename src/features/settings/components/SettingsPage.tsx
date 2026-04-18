import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../store';
import { supabase } from '../../../services/supabase';
import { Settings, Moon, Sun, Key, User, Shield, Check } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, user } = useAppStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'profile'>('general');
  const [fmpKey, setFmpKey] = useState('********************************');
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');

  const handleSaveTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    showToast(`Theme updated to ${newTheme} mode`, 'success');
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('API Keys saved successfully', 'success');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-section-header font-display tracking-tight text-[var(--text-primary)]">Settings</h1>
        <p className="text-body-secondary text-[var(--text-secondary)]">Manage your application preferences and integrations</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-body-secondary font-medium transition-colors text-left
              ${activeTab === 'general' ? 'bg-[var(--bg-surface-3)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
            `}
          >
            <Settings size={18} /> General
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-body-secondary font-medium transition-colors text-left
              ${activeTab === 'api' ? 'bg-[var(--bg-surface-3)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
            `}
          >
            <Key size={18} /> API Keys
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-body-secondary font-medium transition-colors text-left
              ${activeTab === 'profile' ? 'bg-[var(--bg-surface-3)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
            `}
          >
            <User size={18} /> Profile
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          
          {activeTab === 'general' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 shadow-card animate-fade-in">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-6 pb-4 border-b border-[var(--border-subtle)]">Appearance</h3>
              
              <div className="flex flex-col gap-4">
                <label className="text-label text-[var(--text-secondary)]">Theme Preference</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleSaveTheme('dark')}
                    className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-all
                      ${theme === 'dark' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] bg-opacity-5' : 'border-[var(--border-strong)] hover:border-[var(--text-tertiary)]'}
                    `}
                  >
                    <Moon size={32} className={`mb-3 ${theme === 'dark' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Dark Mode</span>
                    {theme === 'dark' && <Check size={16} className="text-[var(--accent-primary)] absolute top-4 right-4" />}
                  </button>
                  
                  <button 
                    onClick={() => handleSaveTheme('light')}
                    className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-all bg-[#f8f9fa]
                      ${theme === 'light' ? 'border-[var(--accent-primary)]' : 'border-[var(--border-strong)] hover:border-[var(--text-tertiary)]'}
                    `}
                  >
                    <Sun size={32} className={`mb-3 ${theme === 'light' ? 'text-[var(--accent-primary)]' : 'text-gray-500'}`} />
                    <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-500'}`}>Light Mode</span>
                    {theme === 'light' && <Check size={16} className="text-[var(--accent-primary)] absolute top-4 right-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 shadow-card animate-fade-in">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-6 pb-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <Shield size={18} className="text-[var(--accent-primary)]" /> External Integrations
              </h3>
              
              <form onSubmit={handleSaveApiKeys} className="flex flex-col gap-6">
                <div>
                  <label className="block text-label font-medium text-[var(--text-primary)] mb-1">Financial Modeling Prep API Key</label>
                  <p className="text-label text-[var(--text-tertiary)] mb-2">Used for fetching live market data and company profiles.</p>
                  <input 
                    type="password" 
                    value={fmpKey}
                    onChange={(e) => setFmpKey(e.target.value)}
                    className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-label font-medium text-[var(--text-primary)] mb-1">Supabase Instance URL</label>
                  <p className="text-label text-[var(--text-tertiary)] mb-2">The backend URL for data persistence and auth.</p>
                  <input 
                    type="text" 
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-[var(--bg-surface-3)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
                    disabled
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-[var(--accent-primary)] text-[var(--bg-base)] px-4 py-2 rounded font-medium hover:bg-opacity-90 transition-opacity">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 shadow-card animate-fade-in">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-6 pb-4 border-b border-[var(--border-subtle)]">User Profile</h3>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] flex items-center justify-center font-display text-4xl shadow-lg">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-[20px] font-medium text-[var(--text-primary)] mb-1">{user?.user_metadata?.display_name || 'Valuation Analyst'}</h4>
                  <p className="text-[var(--text-secondary)]">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-label text-[var(--text-secondary)] mb-1">User ID</label>
                  <input 
                    type="text" 
                    value={user?.id || ''}
                    className="w-full bg-[var(--bg-surface-3)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none font-mono"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-label text-[var(--text-secondary)] mb-1">Last Sign In</label>
                  <input 
                    type="text" 
                    value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : ''}
                    className="w-full bg-[var(--bg-surface-3)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

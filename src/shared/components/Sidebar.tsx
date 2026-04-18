import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../../store';
import { supabase } from '../../services/supabase';
import {
  BarChart2, Calculator, Activity, DollarSign,
  TrendingUp, Dices, Users, Settings, LogOut,
  FolderOpen, Plus, LayoutDashboard, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { AppTab } from '../../types/dcf';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, scenarios, user } = useAppStore();
  const navigate = useNavigate();
  const { id: activeScenarioId } = useParams<{ id: string }>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dcf', label: 'DCF Results', icon: <BarChart2 size={18} /> },
    { id: 'inputs', label: 'Financial Inputs', icon: <Calculator size={18} /> },
    { id: 'sensitivity', label: 'Sensitivity', icon: <Activity size={18} /> },
    { id: 'equity', label: 'Equity Bridge', icon: <DollarSign size={18} /> },
    { id: 'irr', label: 'IRR / Returns', icon: <TrendingUp size={18} /> },
    { id: 'montecarlo', label: 'Monte Carlo', icon: <Dices size={18} /> },
    { id: 'comps', label: 'Comps', icon: <Users size={18} /> },
  ];

  return (
    <div className={`flex flex-col h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 font-display text-card-title tracking-tight text-[var(--accent-primary)]">
            <Activity size={24} />
            <span>Artha<span className="text-[var(--text-primary)]">Graph</span></span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto text-[var(--accent-primary)]">
            <Activity size={24} />
          </div>
        )}
      </div>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-16 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-full p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] z-10"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 flex flex-col gap-6">
        
        {/* SCENARIOS SECTION */}
        <div className="px-3">
          {!sidebarCollapsed && (
            <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3 font-semibold">
              Scenarios
            </h4>
          )}
          <div className="flex flex-col gap-1">
            {scenarios.map(scenario => (
              <NavLink
                key={scenario.id}
                to={`/scenario/${scenario.id}/dcf`}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-body-secondary
                  ${activeScenarioId === scenario.id ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
                `}
                title={sidebarCollapsed ? scenario.label : undefined}
              >
                <FolderOpen size={18} className={activeScenarioId === scenario.id ? 'text-[var(--accent-primary)]' : ''} />
                {!sidebarCollapsed && <span className="truncate flex-1">{scenario.label}</span>}
                {!sidebarCollapsed && activeScenarioId === scenario.id && <Check size={14} className="text-[var(--accent-primary)]" />}
              </NavLink>
            ))}
            <button 
              onClick={() => navigate('/scenarios')}
              className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-body-secondary text-[var(--accent-primary)] hover:bg-[#00c8961a]"
              title={sidebarCollapsed ? "All Scenarios / New" : undefined}
            >
              <LayoutDashboard size={18} />
              {!sidebarCollapsed && <span>Dashboard / New</span>}
            </button>
          </div>
        </div>

        {/* WORKSPACE SECTION */}
        {activeScenarioId && (
          <div className="px-3">
            {!sidebarCollapsed && (
              <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3 font-semibold">
                Workspace
              </h4>
            )}
            <div className="flex flex-col gap-1">
              {tabs.map(tab => (
                <NavLink
                  key={tab.id}
                  to={`/scenario/${activeScenarioId}/${tab.id}`}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-body-secondary
                    ${isActive ? 'bg-[var(--bg-surface-3)] text-[var(--accent-secondary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
                  `}
                  title={sidebarCollapsed ? tab.label : undefined}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, {
                    className: location.pathname.includes(tab.id) ? 'text-[var(--accent-secondary)]' : ''
                  })}
                  {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* TOOLS SECTION */}
        <div className="px-3 mt-auto">
          {!sidebarCollapsed && (
            <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3 font-semibold">
              Tools
            </h4>
          )}
          <div className="flex flex-col gap-1">
            <NavLink
              to="/settings"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-body-secondary
                ${isActive ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'}
              `}
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <Settings size={18} />
              {!sidebarCollapsed && <span>Settings</span>}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded bg-[var(--accent-primary)] text-[var(--bg-base)] flex items-center justify-center font-bold text-sm shrink-0">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 truncate">
              <div className="text-label font-medium text-[var(--text-primary)] truncate">{user?.user_metadata?.display_name || 'User'}</div>
              <div className="text-label truncate">{user?.email}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors p-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

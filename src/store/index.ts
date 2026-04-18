import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { DCFScenario, AppTab } from '../types/dcf';

interface AppStore {
  // Auth
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  
  // Scenarios
  scenarios: DCFScenario[];
  activeScenarioId: string | null;
  setScenarios: (scenarios: DCFScenario[]) => void;
  setActiveScenario: (id: string | null) => void;
  updateScenario: (id: string, updater: (s: DCFScenario) => DCFScenario) => void;
  addScenario: (scenario: DCFScenario) => void;
  deleteScenario: (id: string) => void;
  cloneScenario: (id: string) => void;
  
  // UI
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  scenarios: [],
  activeScenarioId: null,
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenario: (id) => set({ activeScenarioId: id }),
  updateScenario: (id, updater) => set((state) => ({
    scenarios: state.scenarios.map(s => s.id === id ? updater(s) : s)
  })),
  addScenario: (scenario) => set((state) => ({
    scenarios: [...state.scenarios, scenario]
  })),
  deleteScenario: (id) => set((state) => ({
    scenarios: state.scenarios.filter(s => s.id !== id),
    activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId
  })),
  cloneScenario: (id) => set((state) => {
    const toClone = state.scenarios.find(s => s.id === id);
    if (!toClone) return state;
    const newScenario = { ...toClone, id: crypto.randomUUID(), label: `${toClone.label} (Copy)` };
    return { scenarios: [...state.scenarios, newScenario] };
  }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  activeTab: 'dcf',
  setActiveTab: (tab) => set({ activeTab: tab })
}));

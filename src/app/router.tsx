import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../shared/components/Sidebar';
import { TopBar } from '../shared/components/TopBar';
import { useAppStore } from '../store';
import { ToastProvider } from '../shared/components/Toast';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthGuard } from '../features/auth/components/AuthGuard';
import { ScenarioList } from '../features/scenarios/components/ScenarioList';
import { DCFResultsTab } from '../features/dcf/components/DCFResultsTab';
import { FinancialInputsTab } from '../features/dcf/components/FinancialInputsTab';
import { SensitivityTab } from '../features/dcf/components/SensitivityTab';
import { EquityBridgeTab } from '../features/dcf/components/EquityBridgeTab';
import { IRRTab } from '../features/dcf/components/IRRTab';
import { MonteCarloTab } from '../features/dcf/components/MonteCarloTab';
import { CompsTab } from '../features/dcf/components/CompsTab';
import { SettingsPage } from '../features/settings/components/SettingsPage';
import { SharedScenarioView } from '../features/scenarios/components/SharedScenarioView';

const AppShell = () => {
  const { theme } = useAppStore();
  
  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-base)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/',
    element: <AuthGuard><AppShell /></AuthGuard>,
    children: [
      {
        index: true,
        element: <Navigate to="/scenarios" replace />
      },
      {
        path: 'scenarios',
        element: <ScenarioList />
      },
      {
        path: 'scenario/:id',
        element: <Navigate to="dcf" replace />
      },
      {
        path: 'scenario/:id/dcf',
        element: <DCFResultsTab />
      },
      {
        path: 'scenario/:id/inputs',
        element: <FinancialInputsTab />
      },
      {
        path: 'scenario/:id/sensitivity',
        element: <SensitivityTab />
      },
      {
        path: 'scenario/:id/equity',
        element: <EquityBridgeTab />
      },
      {
        path: 'scenario/:id/irr',
        element: <IRRTab />
      },
      {
        path: 'scenario/:id/montecarlo',
        element: <MonteCarloTab />
      },
      {
        path: 'scenario/:id/comps',
        element: <CompsTab />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      }
    ]
  },
  {
    path: '/share/:token',
    element: <SharedScenarioView />
  }
]);

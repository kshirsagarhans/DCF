import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { DCFScenario } from '../../../types/dcf';
import { calculateDCF } from '../../dcf/lib/fcf';
import { MetricCard } from '../../../shared/components/MetricCard';
import { DataTable } from '../../../shared/components/DataTable';
import { ValueBridgeChart } from '../../dcf/components/ValueBridgeChart';
import { Activity, Building, Loader2, PieChart } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../shared/utils/format';

// Note: In a real app, we'd fetch by token from Supabase
// For demo purposes, we will try to fetch by ID or just show a mock if not found

export const SharedScenarioView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [scenario, setScenario] = useState<DCFScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch delay
    setTimeout(() => {
      // Create a mock read-only scenario if none is found in local storage
      const mockScenario: DCFScenario = {
        id: token || 'mock',
        userId: 'system',
        label: 'Shared Read-Only Model',
        companyName: 'Acme Corp (Shared)',
        ticker: 'ACME',
        sector: 'Technology',
        currency: 'USD',
        baseCurrency: 'USD',
        historicalCutoffYear: 2023,
        forecastYears: [2024, 2025, 2026, 2027, 2028],
        ebitdaData: { 2023: 100, 2024: 120, 2025: 140, 2026: 160, 2027: 180, 2028: 200 },
        daData: { 2023: 20, 2024: 25, 2025: 30, 2026: 35, 2027: 40, 2028: 45 },
        capexData: { 2023: 25, 2024: 30, 2025: 35, 2026: 40, 2027: 45, 2028: 50 },
        nwcData: { 2023: 5, 2024: 8, 2025: 10, 2026: 12, 2027: 15, 2028: 18 },
        parameters: { discountRate: 10.5, perpetuityRate: 2.5, corporateTaxRate: 21 },
        useIncomeStatement: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      setScenario(mockScenario);
      setLoading(false);
    }, 1000);
  }, [token]);

  const dcfResults = useMemo(() => {
    if (!scenario) return null;
    return calculateDCF(scenario);
  }, [scenario]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
      </div>
    );
  }

  if (!scenario || !dcfResults) {
    return <div className="p-8 text-[var(--text-primary)] text-center mt-20">Shared model not found or link expired.</div>;
  }

  const waterfallData: any[] = dcfResults.fcfRows.map(r => ({
    name: `Year ${r.year}`,
    pv: r.presentValue,
    isProjected: true
  }));
  waterfallData.push({
    name: 'Terminal Value',
    pv: dcfResults.terminalValuePV,
    isTerminal: true
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      
      {/* Top Banner */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 font-display text-card-title tracking-tight text-[var(--accent-primary)]">
          <Activity size={24} />
          <span>Antigravity<span className="text-[var(--text-primary)]">AVS</span></span>
          <span className="ml-4 px-2 py-0.5 bg-[var(--bg-surface-2)] text-label text-[var(--text-tertiary)] rounded border border-[var(--border-subtle)]">Read Only</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-label text-[var(--accent-primary)] hover:underline font-medium">Log In to AVS</Link>
          <a href="https://antigravity.google.com" className="bg-[var(--accent-primary)] text-[var(--bg-base)] px-4 py-1.5 rounded text-label font-medium hover:bg-opacity-90">Request Access</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 animate-fade-in flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-section-header font-display tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              {scenario.companyName}
              {scenario.ticker && <span className="text-label bg-[var(--bg-surface-2)] px-2 py-1 rounded text-[var(--text-tertiary)] border border-[var(--border-subtle)] translate-y-[-2px]">{scenario.ticker}</span>}
            </h1>
            <p className="text-body-secondary text-[var(--text-secondary)] mt-1">{scenario.label} • Shared on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Top Metric Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Implied Enterprise Value"
            value={dcfResults.enterpriseValue}
            format="currency"
            currencyCode={scenario.currency}
            icon={Building}
          />
          <MetricCard
            title="Terminal Value %"
            value={dcfResults.terminalValuePct}
            format="percentage"
            icon={PieChart}
          />
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-label text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Assumptions</p>
              <div className="flex gap-4 mt-2">
                <div><span className="text-[var(--text-tertiary)]">WACC:</span> <span className="text-[var(--text-primary)] font-medium">{scenario.parameters.discountRate}%</span></div>
                <div><span className="text-[var(--text-tertiary)]">Growth:</span> <span className="text-[var(--text-primary)] font-medium">{scenario.parameters.perpetuityRate}%</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card h-[400px]">
          <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Value Bridge</h3>
          <div className="h-[300px]">
            <ValueBridgeChart data={waterfallData} currency={scenario.currency} />
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { AssumptionsPanel } from './AssumptionsPanel';
import { Settings2, Table } from 'lucide-react';
import { CurrencyInput } from '../../../shared/components/CurrencyInput';
import { formatCurrency } from '../../../shared/utils/format';
import { DCFScenario } from '../../../types/dcf';

export const FinancialInputsTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios, updateScenario } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);

  if (!scenario) return <div className="p-8">Scenario not found.</div>;

  const handleDataChange = (year: number, field: keyof Pick<DCFScenario, 'ebitdaData' | 'daData' | 'capexData' | 'nwcData'>, value: number) => {
    updateScenario(scenario.id, s => ({
      ...s,
      [field]: { ...s[field], [year]: value }
    }));
  };

  const years = scenario.forecastYears;
  const isHistorical = (year: number) => year <= scenario.historicalCutoffYear;

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <Table size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">Financial Data Inputs</h2>
              <p className="text-label text-[var(--text-secondary)]">Direct EBITDA Entry Mode</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-card overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr>
                <th className="px-4 py-3 border-b border-[var(--border-strong)] bg-[var(--bg-surface-2)] sticky left-0 z-10 w-48">
                  <span className="text-label font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Metric</span>
                </th>
                {years.map(year => (
                  <th key={year} className={`px-4 py-3 border-b border-[var(--border-strong)] text-center min-w-[120px] ${isHistorical(year) ? 'bg-[#ff5c3a1a]' : 'bg-[var(--bg-surface-2)]'}`}>
                    <div className={`text-label font-bold mb-1 ${isHistorical(year) ? 'text-[var(--accent-coral)]' : 'text-[var(--text-secondary)]'}`}>
                      {year}
                    </div>
                    <div className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${isHistorical(year) ? 'bg-[var(--accent-coral)] text-white' : 'bg-[var(--border-strong)] text-[var(--text-secondary)]'}`}>
                      {isHistorical(year) ? 'Actual' : 'Forecast'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {/* EBITDA Row */}
              <tr className="hover:bg-[var(--bg-surface-2)] transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
                  EBITDA
                </td>
                {years.map(year => (
                  <td key={year} className="px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0">
                    <input 
                      type="number"
                      value={scenario.ebitdaData[year] || ''}
                      onChange={(e) => handleDataChange(year, 'ebitdaData', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] rounded px-2 py-1 text-right data-number outline-none"
                    />
                  </td>
                ))}
              </tr>
              {/* D&A Row */}
              <tr className="hover:bg-[var(--bg-surface-2)] transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
                  Depreciation & Amort.
                </td>
                {years.map(year => (
                  <td key={year} className="px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0">
                    <input 
                      type="number"
                      value={scenario.daData[year] || ''}
                      onChange={(e) => handleDataChange(year, 'daData', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] rounded px-2 py-1 text-right data-number outline-none"
                    />
                  </td>
                ))}
              </tr>
              {/* EBIT Preview Row (Read only) */}
              <tr className="bg-[#f5f7fa08]">
                <td className="px-4 py-3 sticky left-0 font-medium text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                  EBIT (Calculated)
                </td>
                {years.map(year => {
                  const ebit = (scenario.ebitdaData[year] || 0) - (scenario.daData[year] || 0);
                  return (
                    <td key={year} className="px-4 py-3 text-right text-[var(--text-secondary)] data-number border-r border-[var(--border-subtle)] last:border-r-0 font-medium">
                      {formatCurrency(ebit, scenario.currency, true).replace('.0', '')}
                    </td>
                  );
                })}
              </tr>
              {/* CapEx Row */}
              <tr className="hover:bg-[var(--bg-surface-2)] transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
                  Capital Expenditures
                </td>
                {years.map(year => (
                  <td key={year} className="px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0">
                    <input 
                      type="number"
                      value={scenario.capexData[year] || ''}
                      onChange={(e) => handleDataChange(year, 'capexData', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] rounded px-2 py-1 text-right data-number outline-none"
                    />
                  </td>
                ))}
              </tr>
              {/* NWC Row */}
              <tr className="hover:bg-[var(--bg-surface-2)] transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Change in NWC</span>
                </td>
                {years.map(year => (
                  <td key={year} className="px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0">
                    <input 
                      type="number"
                      value={scenario.nwcData[year] || ''}
                      onChange={(e) => handleDataChange(year, 'nwcData', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] rounded px-2 py-1 text-right data-number outline-none"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="w-[350px] shrink-0 hidden xl:block border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <AssumptionsPanel scenario={scenario} />
      </div>
    </div>
  );
};

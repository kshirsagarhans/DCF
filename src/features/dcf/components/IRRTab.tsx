import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { calculateDCF } from '../lib/fcf';
import { calculateIRR } from '../lib/irr';
import { CurrencyInput } from '../../../shared/components/CurrencyInput';
import { ParameterSlider } from '../../../shared/components/ParameterSlider';
import { formatCurrency, formatPercentage } from '../../../shared/utils/format';
import { ReturnsProfileChart } from './ReturnsProfileChart';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { IRRInputs } from '../../../types/dcf';

export const IRRTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios, updateScenario } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);

  const dcfResults = useMemo(() => {
    if (!scenario) return null;
    try {
      return calculateDCF(scenario);
    } catch (e) {
      return null;
    }
  }, [scenario]);

  if (!scenario || !dcfResults) return <div className="p-8">Scenario not found.</div>;

  const defaultHoldingPeriod = Math.min(5, scenario.forecastYears.length);
  const exitYearStr = scenario.forecastYears[defaultHoldingPeriod - 1];
  const defaultExitEbitda = scenario.ebitdaData[exitYearStr] || 0;

  const irrInputs: IRRInputs = scenario.irrInputs || {
    entryEV: dcfResults.enterpriseValue,
    entryEbitda: scenario.ebitdaData[scenario.historicalCutoffYear] || 1,
    holdingPeriodYears: defaultHoldingPeriod,
    exitEVMultiple: 10,
    exitYearEbitda: defaultExitEbitda,
    netDebtAtExit: 0,
    equityInvested: dcfResults.enterpriseValue // Assuming all equity for simplicity initially
  };

  const irrResults = useMemo(() => {
    try {
      return calculateIRR(irrInputs, dcfResults.fcfRows);
    } catch {
      return null;
    }
  }, [irrInputs, dcfResults]);

  const handleInput = (key: keyof IRRInputs, value: number) => {
    updateScenario(scenario.id, s => {
      const inputs = s.irrInputs || irrInputs;
      
      const newInputs = { ...inputs, [key]: value };
      
      // If holding period changes, auto-update the exit EBITDA
      if (key === 'holdingPeriodYears') {
        const hYear = s.forecastYears[value - 1];
        if (hYear) {
          newInputs.exitYearEbitda = s.ebitdaData[hYear] || 0;
        }
      }
      
      return { ...s, irrInputs: newInputs };
    });
  };

  const handleUseDCFValue = () => {
    handleInput('entryEV', dcfResults.enterpriseValue);
  };

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">LBO / Returns Analysis</h2>
              <p className="text-label text-[var(--text-secondary)]">Internal Rate of Return & MOIC</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Panel */}
          <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col gap-6">
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-card-title text-[var(--text-primary)] font-medium">Entry Assumptions</h3>
                <button 
                  onClick={handleUseDCFValue}
                  className="flex items-center gap-1.5 text-label text-[var(--accent-secondary)] hover:underline"
                >
                  <RefreshCw size={14} /> Use DCF EV
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <CurrencyInput label="Entry Enterprise Value" value={irrInputs.entryEV} currency={scenario.currency} onChange={v => handleInput('entryEV', v)} />
                <CurrencyInput label="Initial Equity Invested" value={irrInputs.equityInvested} currency={scenario.currency} onChange={v => handleInput('equityInvested', v)} />
                <div className="flex justify-between items-center text-label">
                  <span className="text-[var(--text-secondary)]">Entry Multiple:</span>
                  <span className="text-[var(--text-primary)] font-medium">{irrInputs.entryEbitda > 0 ? (irrInputs.entryEV / irrInputs.entryEbitda).toFixed(1) : '-'}x EV/EBITDA</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--border-subtle)] w-full"></div>

            <div>
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Exit Assumptions</h3>
              
              <div className="flex flex-col gap-4">
                <ParameterSlider
                  label="Holding Period (Years)"
                  value={irrInputs.holdingPeriodYears}
                  min={1} max={scenario.forecastYears.length} step={1} unit="yrs"
                  onChange={(val) => handleInput('holdingPeriodYears', val)}
                />
                
                <ParameterSlider
                  label="Exit Multiple (EV/EBITDA)"
                  value={irrInputs.exitEVMultiple}
                  min={1} max={50} step={0.5} unit="x"
                  onChange={(val) => handleInput('exitEVMultiple', val)}
                />

                <div className="flex justify-between items-center text-label">
                  <span className="text-[var(--text-secondary)]">Exit Year EBITDA:</span>
                  <span className="text-[var(--text-primary)] font-medium data-number">{formatCurrency(irrInputs.exitYearEbitda, scenario.currency)}</span>
                </div>
                
                <CurrencyInput label="Net Debt at Exit" value={irrInputs.netDebtAtExit} currency={scenario.currency} onChange={v => handleInput('netDebtAtExit', v)} />
              </div>
            </div>

          </div>

          {/* Outputs Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 rounded-lg shadow-card flex flex-col justify-center items-center">
                <h4 className="text-label text-[var(--text-secondary)] mb-2 uppercase tracking-wider font-semibold">Internal Rate of Return</h4>
                <div className={`text-[48px] font-display tracking-tight leading-none data-number ${irrResults && irrResults.irr > 0.2 ? 'text-[var(--positive)]' : 'text-[var(--text-primary)]'}`}>
                  {irrResults ? formatPercentage(irrResults.irr * 100) : '-'}
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 rounded-lg shadow-card flex flex-col justify-center items-center">
                <h4 className="text-label text-[var(--text-secondary)] mb-2 uppercase tracking-wider font-semibold">Multiple on Invested Capital</h4>
                <div className={`text-[48px] font-display tracking-tight leading-none data-number ${irrResults && irrResults.moic > 2.0 ? 'text-[var(--positive)]' : 'text-[var(--text-primary)]'}`}>
                  {irrResults ? `${irrResults.moic.toFixed(2)}x` : '-'}
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col flex-1">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-1">Cash Flow Profile</h3>
              <p className="text-label text-[var(--text-secondary)] mb-4">Initial investment vs projected FCF and exit value</p>
              
              <div className="flex-1 min-h-[300px]">
                {irrResults ? (
                  <ReturnsProfileChart cashFlows={irrResults.cashFlows} currency={scenario.currency} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[var(--text-tertiary)]">
                    No cash flow data available
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

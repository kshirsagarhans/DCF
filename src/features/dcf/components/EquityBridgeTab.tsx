import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { calculateDCF } from '../lib/fcf';
import { calculateEquityBridge } from '../lib/equityBridge';
import { CurrencyInput } from '../../../shared/components/CurrencyInput';
import { formatCurrency, formatPercentage } from '../../../shared/utils/format';
import { EquityWaterfallChart } from './EquityWaterfallChart';
import { DollarSign, RefreshCw } from 'lucide-react';
import { marketDataService } from '../../../services/marketData';
import { useToast } from '../../../shared/components/Toast';

export const EquityBridgeTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios, updateScenario } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);
  const { showToast } = useToast();

  const dcfResults = useMemo(() => {
    if (!scenario) return null;
    try {
      return calculateDCF(scenario);
    } catch (e) {
      return null;
    }
  }, [scenario]);

  if (!scenario || !dcfResults) return <div className="p-8">Scenario not found.</div>;

  const eq = scenario.equityBridgeInputs || {
    netDebt: 0, preferredEquity: 0, minorityInterest: 0, cashAndEquivalents: 0, dilutedSharesOutstanding: 0, currentMarketPrice: 0
  };

  const equityOutput = calculateEquityBridge(dcfResults.enterpriseValue, eq);

  const handleInput = (key: keyof typeof eq, value: number) => {
    updateScenario(scenario.id, s => ({
      ...s,
      equityBridgeInputs: { ...eq, [key]: value }
    }));
  };

  const handleAutoPopulate = async () => {
    if (!scenario.ticker) {
      showToast('Ticker not set for this scenario.', 'error');
      return;
    }
    showToast('Fetching market data...', 'info');
    try {
      const quote = await marketDataService.getQuote(scenario.ticker);
      updateScenario(scenario.id, s => ({
        ...s,
        equityBridgeInputs: { 
          ...eq, 
          currentMarketPrice: quote.price,
          dilutedSharesOutstanding: quote.sharesOutstanding
        }
      }));
      showToast('Market price and shares populated.', 'success');
    } catch (error) {
      showToast('Could not fetch market data.', 'error');
    }
  };

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">Equity Bridge</h2>
              <p className="text-label text-[var(--text-secondary)]">Enterprise Value to Equity Value per Share</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Panel */}
          <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium">Balance Sheet</h3>
              {scenario.ticker && (
                <button 
                  onClick={handleAutoPopulate}
                  className="flex items-center gap-1.5 text-label text-[var(--accent-secondary)] hover:underline"
                >
                  <RefreshCw size={14} /> Auto-fill
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-[var(--bg-surface-2)] p-3 rounded flex justify-between items-center border border-[var(--border-subtle)]">
                <span className="text-label text-[var(--text-secondary)]">Enterprise Value</span>
                <span className="text-body-primary font-medium text-[var(--text-primary)] data-number">{formatCurrency(dcfResults.enterpriseValue, scenario.currency)}</span>
              </div>
              
              <div className="h-px bg-[var(--border-subtle)] my-1"></div>

              <CurrencyInput label="Net Debt / Gross Debt" value={eq.netDebt} currency={scenario.currency} onChange={v => handleInput('netDebt', v)} />
              <CurrencyInput label="Preferred Equity" value={eq.preferredEquity} currency={scenario.currency} onChange={v => handleInput('preferredEquity', v)} />
              <CurrencyInput label="Minority Interest" value={eq.minorityInterest} currency={scenario.currency} onChange={v => handleInput('minorityInterest', v)} />
              <CurrencyInput label="Cash & Equivalents" value={eq.cashAndEquivalents} currency={scenario.currency} onChange={v => handleInput('cashAndEquivalents', v)} />
              
              <div className="h-px bg-[var(--border-subtle)] my-1"></div>

              <CurrencyInput label="Diluted Shares Outstanding" value={eq.dilutedSharesOutstanding} currency="" onChange={v => handleInput('dilutedSharesOutstanding', v)} />
              <CurrencyInput label="Current Market Price" value={eq.currentMarketPrice} currency={scenario.currency} onChange={v => handleInput('currentMarketPrice', v)} />
            </div>
          </div>

          {/* Outputs & Charts Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                <h4 className="text-label text-[var(--text-secondary)] mb-1">Intrinsic Value/Share</h4>
                <div className="text-section-header font-display tracking-tight text-[var(--text-primary)] data-number">
                  {formatCurrency(equityOutput.intrinsicSharePrice, scenario.currency)}
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                <h4 className="text-label text-[var(--text-secondary)] mb-1">Market Price</h4>
                <div className="text-section-header font-display tracking-tight text-[var(--text-primary)] data-number">
                  {eq.currentMarketPrice > 0 ? formatCurrency(eq.currentMarketPrice, scenario.currency) : '-'}
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                <h4 className="text-label text-[var(--text-secondary)] mb-1">Upside / (Downside)</h4>
                <div className={`text-section-header font-display tracking-tight data-number ${equityOutput.upside > 0 ? 'text-[var(--positive)]' : equityOutput.upside < 0 ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]'}`}>
                  {eq.currentMarketPrice > 0 ? formatPercentage(equityOutput.upside) : '-'}
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col flex-1">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Value Bridge Waterfall</h3>
              <div className="flex-1 min-h-[350px]">
                <EquityWaterfallChart ev={dcfResults.enterpriseValue} inputs={eq} output={equityOutput} currency={scenario.currency} />
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-3">Margin of Safety</h3>
              
              <div className="relative h-6 bg-[var(--bg-surface-2)] rounded-full overflow-hidden mt-6 mb-2">
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-[var(--text-tertiary)] z-10"></div>
                
                {/* Meter fill */}
                {equityOutput.marginOfSafetyPct > 0 ? (
                  <div 
                    className="absolute top-0 bottom-0 left-1/3 bg-[var(--positive)] transition-all duration-500" 
                    style={{ width: `${Math.min(66.6, (equityOutput.marginOfSafetyPct / 100) * 66.6)}%` }}
                  ></div>
                ) : (
                  <div 
                    className="absolute top-0 bottom-0 bg-[var(--negative)] transition-all duration-500 right-[66.6%]" 
                    style={{ width: `${Math.min(33.3, (Math.abs(equityOutput.marginOfSafetyPct) / 50) * 33.3)}%` }}
                  ></div>
                )}
              </div>
              
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] px-1">
                <span>-50% Overvalued</span>
                <span className="ml-[16%]">0% Fair Value</span>
                <span>+100% Undervalued</span>
              </div>
              
              <div className="text-center mt-4 text-body-primary font-medium text-[var(--text-primary)]">
                Implied Margin of Safety: <span className={equityOutput.marginOfSafetyPct > 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>{formatPercentage(equityOutput.marginOfSafetyPct)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

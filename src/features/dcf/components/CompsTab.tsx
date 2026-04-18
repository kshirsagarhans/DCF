import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { marketDataService } from '../../../services/marketData';
import { DataTable } from '../../../shared/components/DataTable';
import { CompsBubbleChart } from './CompsBubbleChart';
import { formatCurrency, formatNumber, formatPercentage } from '../../../shared/utils/format';
import { Users, Plus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';
import { CompsEntry } from '../../../types/dcf';

export const CompsTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios, updateScenario } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);
  const { showToast } = useToast();

  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize comps array if undefined
  useEffect(() => {
    if (scenario && !scenario.comps) {
      updateScenario(scenario.id, s => ({ ...s, comps: [] }));
    }
  }, [scenario, updateScenario]);

  if (!scenario) return <div className="p-8">Scenario not found.</div>;

  const comps = scenario.comps || [];

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker) return;
    
    if (comps.find(c => c.ticker === newTicker.toUpperCase())) {
      showToast('Ticker already exists in comps group', 'warning');
      return;
    }

    setLoading(true);
    try {
      const ticker = newTicker.toUpperCase();
      const profile = await marketDataService.getProfile(ticker);
      const metrics = await marketDataService.getKeyMetrics(ticker);

      const entry: CompsEntry = {
        ticker,
        companyName: profile.companyName,
        evToEbitda: metrics.evToEbitda,
        peRatio: metrics.peRatio,
        evToRevenue: metrics.evToSales,
        marketCap: profile.mktCap,
        revenueGrowth: metrics.revenueGrowth,
        ebitdaMargin: metrics.ebitdaMargin,
        currency: profile.currency || 'USD'
      };

      updateScenario(scenario.id, s => ({
        ...s,
        comps: [...(s.comps || []), entry]
      }));
      setNewTicker('');
      showToast(`Added ${ticker} to comps`, 'success');
    } catch (error) {
      showToast(`Could not fetch data for ${newTicker}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveComp = (ticker: string) => {
    updateScenario(scenario.id, s => ({
      ...s,
      comps: (s.comps || []).filter(c => c.ticker !== ticker)
    }));
  };

  // Prepare table columns
  const tableColumns = [
    { 
      id: 'company', 
      header: 'Company', 
      cell: ({ row }: { row: CompsEntry }) => (
        <div>
          <div className="font-medium">{row.ticker}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{row.companyName}</div>
        </div>
      ),
      align: 'left' as const 
    },
    { 
      id: 'mktCap', 
      header: 'Market Cap', 
      cell: ({ row }: { row: CompsEntry }) => formatCurrency(row.marketCap, row.currency, true),
      align: 'right' as const 
    },
    { 
      id: 'evToEbitda', 
      header: 'EV / EBITDA', 
      cell: ({ row }: { row: CompsEntry }) => `${row.evToEbitda.toFixed(1)}x`,
      align: 'right' as const 
    },
    { 
      id: 'peRatio', 
      header: 'P/E', 
      cell: ({ row }: { row: CompsEntry }) => `${row.peRatio.toFixed(1)}x`,
      align: 'right' as const 
    },
    { 
      id: 'evToRevenue', 
      header: 'EV / Rev', 
      cell: ({ row }: { row: CompsEntry }) => `${row.evToRevenue.toFixed(1)}x`,
      align: 'right' as const 
    },
    { 
      id: 'ebitdaMargin', 
      header: 'EBITDA Margin', 
      cell: ({ row }: { row: CompsEntry }) => formatPercentage(row.ebitdaMargin * 100),
      align: 'right' as const 
    },
    { 
      id: 'actions', 
      header: '', 
      cell: ({ row }: { row: CompsEntry }) => (
        <button 
          onClick={() => handleRemoveComp(row.ticker)}
          className="text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      ),
      align: 'center' as const 
    },
  ];

  // Calculate Medians
  const medians = {
    evToEbitda: comps.length ? [...comps].sort((a,b) => a.evToEbitda - b.evToEbitda)[Math.floor(comps.length/2)].evToEbitda : 0,
    peRatio: comps.length ? [...comps].sort((a,b) => a.peRatio - b.peRatio)[Math.floor(comps.length/2)].peRatio : 0,
  };

  // Implied Valuation for Target (using Year 1 forward EBITDA if available, else historical)
  const targetEbitda = scenario.ebitdaData[scenario.historicalCutoffYear + 1] || scenario.ebitdaData[scenario.historicalCutoffYear] || 0;
  const impliedEV = targetEbitda * medians.evToEbitda;

  const chartData = comps.map(c => ({
    ticker: c.ticker,
    margin: c.ebitdaMargin,
    evToEbitda: c.evToEbitda,
    mktCap: c.marketCap,
    currency: c.currency,
    isTarget: false
  }));

  // Add target to chart if we have a target EBITDA multiple
  if (scenario.ticker && targetEbitda > 0 && impliedEV > 0) {
    const targetRev = targetEbitda / 0.2; // Mock target revenue to get margin
    chartData.push({
      ticker: scenario.ticker,
      margin: targetEbitda / targetRev,
      evToEbitda: impliedEV / targetEbitda,
      mktCap: impliedEV, // Rough proxy for bubble size
      currency: scenario.currency,
      isTarget: true
    });
  }

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">Comparable Company Analysis</h2>
              <p className="text-label text-[var(--text-secondary)]">Relative Valuation via Trading Multiples</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Comps Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-card-title text-[var(--text-primary)] font-medium">Peer Group</h3>
                
                <form onSubmit={handleAddTicker} className="flex gap-2">
                  <input 
                    value={newTicker}
                    onChange={e => setNewTicker(e.target.value.toUpperCase())}
                    placeholder="Add ticker (e.g. MSFT)"
                    className="bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-1 outline-none focus:border-[var(--accent-primary)] uppercase text-label w-40"
                  />
                  <button 
                    type="submit"
                    disabled={!newTicker || loading}
                    className="bg-[var(--bg-surface-3)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors h-[30px] w-[30px] flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  </button>
                </form>
              </div>

              <DataTable data={comps} columns={tableColumns} emptyMessage="Add tickers to build your peer group." />
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-1">
                Margin vs Multiple Profile
              </h3>
              <p className="text-label text-[var(--text-secondary)] mb-6">
                Evaluating target relative to peers
              </p>
              <div className="flex-1 min-h-[350px]">
                {comps.length > 0 ? (
                  <CompsBubbleChart data={chartData} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[var(--text-tertiary)]">
                    Add peers to see scatter plot
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Outputs Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 rounded-lg shadow-card">
              <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Peer Group Medians</h3>
              
              <div className="flex flex-col gap-4">
                <div className="bg-[var(--bg-surface-2)] p-3 rounded flex justify-between items-center border border-[var(--border-subtle)]">
                  <span className="text-label text-[var(--text-secondary)]">EV / EBITDA</span>
                  <span className="text-body-primary font-medium text-[var(--text-primary)] data-number">{medians.evToEbitda > 0 ? `${medians.evToEbitda.toFixed(1)}x` : '-'}</span>
                </div>
                <div className="bg-[var(--bg-surface-2)] p-3 rounded flex justify-between items-center border border-[var(--border-subtle)]">
                  <span className="text-label text-[var(--text-secondary)]">P/E</span>
                  <span className="text-body-primary font-medium text-[var(--text-primary)] data-number">{medians.peRatio > 0 ? `${medians.peRatio.toFixed(1)}x` : '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--accent-primary)] text-[var(--bg-base)] border border-[var(--accent-primary)] p-5 rounded-lg shadow-card text-center">
              <h3 className="text-label font-medium mb-2 opacity-90 uppercase tracking-wider">Implied Enterprise Value</h3>
              <p className="text-[10px] opacity-75 mb-4">(Forward EBITDA × Median Peer Multiple)</p>
              
              <div className="text-[36px] font-display tracking-tight leading-none data-number mb-6">
                {impliedEV > 0 ? formatCurrency(impliedEV, scenario.currency, true) : '-'}
              </div>

              <div className="flex justify-between items-center text-label pt-4 border-t border-[var(--bg-base)] border-opacity-20 text-left">
                <div>
                  <span className="block opacity-75">Target Fwd EBITDA</span>
                  <span className="font-medium data-number">{formatCurrency(targetEbitda, scenario.currency, true)}</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-75">Median EV/EBITDA</span>
                  <span className="font-medium data-number">{medians.evToEbitda > 0 ? `${medians.evToEbitda.toFixed(1)}x` : '-'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

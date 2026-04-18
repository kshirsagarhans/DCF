import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { ParameterSlider } from '../../../shared/components/ParameterSlider';
import { formatCurrency, formatNumber } from '../../../shared/utils/format';
import { DistributionChart } from './DistributionChart';
import { Dices, Play, Loader2 } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';
import { MonteCarloConfig, MonteCarloResults } from '../../../types/dcf';
import MonteCarloWorker from '../../montecarlo/workers/montecarlo.worker?worker';

export const MonteCarloTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);
  const { showToast } = useToast();

  const workerRef = useRef<Worker | null>(null);

  const [config, setConfig] = useState<MonteCarloConfig>({
    trials: 10000,
    waccMean: 10,
    waccStd: 1.0,
    growthMean: 2.0,
    growthStd: 0.5,
    ebitdaGrowthMean: 5.0,
    ebitdaGrowthStd: 2.0, // 2% std dev for EBITDA
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<MonteCarloResults | null>(null);

  useEffect(() => {
    workerRef.current = new MonteCarloWorker();
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress(e.data.progress);
      } else if (e.data.type === 'complete') {
        setResults(e.data.results);
        setIsSimulating(false);
        setProgress(100);
        showToast('Simulation complete!', 'success');
      } else if (e.data.type === 'error') {
        setIsSimulating(false);
        showToast(`Simulation error: ${e.data.error}`, 'error');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runSimulation = () => {
    if (!scenario || isSimulating || !workerRef.current) return;
    setIsSimulating(true);
    setProgress(0);
    setResults(null);
    workerRef.current.postMessage({ baseScenario: scenario, config });
  };

  if (!scenario) return <div className="p-8">Scenario not found.</div>;

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <Dices size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">Monte Carlo Simulation</h2>
              <p className="text-label text-[var(--text-secondary)]">Stochastic Enterprise Value Distribution</p>
            </div>
          </div>
          
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--bg-base)] px-4 py-2 rounded font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Panel */}
          <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col gap-6">
            <h3 className="text-card-title text-[var(--text-primary)] font-medium">Simulation Config</h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label text-[var(--text-secondary)] mb-1">Iterations</label>
                <select 
                  value={config.trials} 
                  onChange={e => setConfig({ ...config, trials: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
                  disabled={isSimulating}
                >
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={50000}>50,000</option>
                </select>
              </div>

              <ParameterSlider
                label="WACC Std. Dev."
                value={config.waccStd}
                min={0} max={5} step={0.1} unit="%"
                onChange={(val) => setConfig({ ...config, waccStd: val })}
              />
              
              <ParameterSlider
                label="Term. Growth Std. Dev."
                value={config.growthStd}
                min={0} max={3} step={0.1} unit="%"
                onChange={(val) => setConfig({ ...config, growthStd: val })}
              />

              <ParameterSlider
                label="EBITDA Margin Std. Dev."
                value={config.ebitdaGrowthStd}
                min={0} max={10} step={0.5} unit="%"
                onChange={(val) => setConfig({ ...config, ebitdaGrowthStd: val })}
              />
            </div>
            
            {isSimulating && (
              <div className="mt-4">
                <div className="flex justify-between text-label mb-1">
                  <span className="text-[var(--text-secondary)]">Running {formatNumber(config.trials)} paths...</span>
                  <span className="text-[var(--accent-primary)]">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[var(--bg-surface-2)] rounded-full h-2">
                  <div className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Outputs Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {results ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                    <h4 className="text-label text-[var(--text-secondary)] mb-1">Mean (Expected) EV</h4>
                    <div className="text-section-header font-display tracking-tight text-[var(--text-primary)] data-number">
                      {formatCurrency(results.mean, scenario.currency)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                    <h4 className="text-label text-[var(--text-secondary)] mb-1">Median (P50) EV</h4>
                    <div className="text-section-header font-display tracking-tight text-[var(--text-primary)] data-number">
                      {formatCurrency(results.p50, scenario.currency)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                    <h4 className="text-label text-[var(--text-secondary)] mb-1">10th Percentile (P10)</h4>
                    <div className="text-section-header font-display tracking-tight text-[var(--negative)] data-number">
                      {formatCurrency(results.p10, scenario.currency)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg shadow-card">
                    <h4 className="text-label text-[var(--text-secondary)] mb-1">90th Percentile (P90)</h4>
                    <div className="text-section-header font-display tracking-tight text-[var(--positive)] data-number">
                      {formatCurrency(results.p90, scenario.currency)}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-card-title text-[var(--text-primary)] font-medium">Enterprise Value Distribution</h3>
                      <p className="text-label text-[var(--text-secondary)]">Histogram of {formatNumber(config.trials)} simulated outcomes</p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[350px]">
                    <DistributionChart results={results} currency={scenario.currency} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
                <Dices size={48} className="mb-4 opacity-50" />
                <h3 className="text-card-title text-[var(--text-primary)] mb-2">No Simulation Data</h3>
                <p className="text-[var(--text-secondary)] max-w-md text-center">
                  Configure the standard deviations and click "Run Simulation" to generate a probabilistic distribution of enterprise values.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

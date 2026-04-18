import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { buildSensitivityGrid } from '../lib/sensitivity';
import { calculateDCF } from '../lib/fcf';
import { SensitivityHeatmap } from './SensitivityHeatmap';
import { TornadoChart } from './TornadoChart';
import { AssumptionsPanel } from './AssumptionsPanel';
import { Activity, Download } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';

export const SensitivityTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios, updateScenario } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);
  const { showToast } = useToast();

  const [waccRange, setWaccRange] = useState<[number, number, number]>([
    Math.max(1, (scenario?.parameters.discountRate || 10) - 3),
    (scenario?.parameters.discountRate || 10) + 3,
    1
  ]);
  const [growthRange, setGrowthRange] = useState<[number, number, number]>([
    Math.max(0, (scenario?.parameters.perpetuityRate || 2) - 1.5),
    (scenario?.parameters.perpetuityRate || 2) + 1.5,
    0.5
  ]);
  const [showSharePrice, setShowSharePrice] = useState(false);

  const gridData = useMemo(() => {
    if (!scenario) return null;
    try {
      return buildSensitivityGrid(scenario, waccRange, growthRange, true);
    } catch (e) {
      return null;
    }
  }, [scenario, waccRange, growthRange]);

  const tornadoData = useMemo(() => {
    if (!scenario) return [];
    try {
      const baseDCF = calculateDCF(scenario);
      const baseEV = baseDCF.enterpriseValue;
      
      const p = scenario.parameters;
      const calcEV = (w: number, g: number, t: number) => {
        const copy = { ...scenario, parameters: { ...scenario.parameters, discountRate: w, perpetuityRate: g, corporateTaxRate: t } };
        return calculateDCF(copy).enterpriseValue;
      };

      return [
        {
          name: 'WACC (±1%)',
          lowImpact: calcEV(p.discountRate + 1, p.perpetuityRate, p.corporateTaxRate),
          highImpact: calcEV(Math.max(1, p.discountRate - 1), p.perpetuityRate, p.corporateTaxRate),
          baseEV
        },
        {
          name: 'Term. Growth (±0.5%)',
          lowImpact: calcEV(p.discountRate, Math.max(0, p.perpetuityRate - 0.5), p.corporateTaxRate),
          highImpact: calcEV(p.discountRate, p.perpetuityRate + 0.5, p.corporateTaxRate),
          baseEV
        },
        {
          name: 'Tax Rate (±5%)',
          lowImpact: calcEV(p.discountRate, p.perpetuityRate, Math.min(60, p.corporateTaxRate + 5)),
          highImpact: calcEV(p.discountRate, p.perpetuityRate, Math.max(0, p.corporateTaxRate - 5)),
          baseEV
        }
      ];
    } catch (e) {
      return [];
    }
  }, [scenario]);

  if (!scenario) return <div className="p-8">Scenario not found.</div>;

  const handleCellClick = (wacc: number, growth: number) => {
    updateScenario(scenario.id, s => ({
      ...s,
      parameters: { ...s.parameters, discountRate: wacc, perpetuityRate: growth }
    }));
    showToast(`Scenario updated: WACC ${wacc}%, Growth ${growth}%`, 'success');
  };

  const hasEquityInputs = scenario.equityBridgeInputs && Object.values(scenario.equityBridgeInputs).some(v => v > 0);

  return (
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-card-title font-medium text-[var(--text-primary)]">Sensitivity Analysis</h2>
              <p className="text-label text-[var(--text-secondary)]">WACC vs Terminal Growth Rate</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            {hasEquityInputs && (
              <label className="flex items-center gap-2 cursor-pointer bg-[var(--bg-surface-2)] px-3 py-1.5 rounded border border-[var(--border-subtle)]">
                <input 
                  type="checkbox" 
                  checked={showSharePrice} 
                  onChange={e => setShowSharePrice(e.target.checked)} 
                  className="accent-[var(--accent-primary)]"
                />
                <span className="text-label font-medium">Show Share Price</span>
              </label>
            )}
            
            <button className="flex items-center gap-2 px-3 py-1.5 text-label font-medium bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded hover:bg-[var(--bg-surface-3)] transition-colors">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col">
            <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-1">
              Valuation Matrix
            </h3>
            <p className="text-label text-[var(--text-secondary)] mb-6">
              Click any cell to update the base scenario
            </p>
            
            {/* Grid Controls */}
            <div className="flex gap-6 mb-4 pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-label text-[var(--text-secondary)] block mb-1">WACC Range (%)</span>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.5" value={waccRange[0]} onChange={e => setWaccRange([Number(e.target.value), waccRange[1], waccRange[2]])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                  <span className="text-[var(--text-tertiary)]">to</span>
                  <input type="number" step="0.5" value={waccRange[1]} onChange={e => setWaccRange([waccRange[0], Number(e.target.value), waccRange[2]])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                  <span className="text-[var(--text-tertiary)]">step</span>
                  <input type="number" step="0.1" value={waccRange[2]} onChange={e => setWaccRange([waccRange[0], waccRange[1], Number(e.target.value)])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                </div>
              </div>
              <div>
                <span className="text-label text-[var(--text-secondary)] block mb-1">Growth Range (%)</span>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.5" value={growthRange[0]} onChange={e => setGrowthRange([Number(e.target.value), growthRange[1], growthRange[2]])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                  <span className="text-[var(--text-tertiary)]">to</span>
                  <input type="number" step="0.5" value={growthRange[1]} onChange={e => setGrowthRange([growthRange[0], Number(e.target.value), growthRange[2]])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                  <span className="text-[var(--text-tertiary)]">step</span>
                  <input type="number" step="0.1" value={growthRange[2]} onChange={e => setGrowthRange([growthRange[0], growthRange[1], Number(e.target.value)])} className="w-16 bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded px-2 py-1 text-label" />
                </div>
              </div>
            </div>

            {gridData ? (
              <SensitivityHeatmap 
                grid={gridData} 
                baseWacc={scenario.parameters.discountRate}
                baseGrowth={scenario.parameters.perpetuityRate}
                currency={scenario.currency}
                onCellClick={handleCellClick}
                showSharePrice={showSharePrice}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-[var(--accent-coral)]">
                Invalid ranges (e.g. WACC &lt;= Growth)
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card flex flex-col">
            <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-1">
              Tornado Chart
            </h3>
            <p className="text-label text-[var(--text-secondary)] mb-6">
              Impact of ±1 standard deviation on Enterprise Value
            </p>
            <div className="flex-1">
              <TornadoChart data={tornadoData} currency={scenario.currency} />
            </div>
          </div>
        </div>

      </div>

      <div className="w-[350px] shrink-0 hidden xl:block border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <AssumptionsPanel scenario={scenario} />
      </div>
    </div>
  );
};

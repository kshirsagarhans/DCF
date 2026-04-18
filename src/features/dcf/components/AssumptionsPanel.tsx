import React from 'react';
import { useAppStore } from '../../../store';
import { ParameterSlider } from '../../../shared/components/ParameterSlider';
import { CurrencyInput } from '../../../shared/components/CurrencyInput';
import { calculateDCF } from '../lib/fcf';
import { ChevronRight, Settings2 } from 'lucide-react';
import { DCFScenario, EquityBridgeInputs } from '../../../types/dcf';

interface AssumptionsPanelProps {
  scenario: DCFScenario;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({ scenario }) => {
  const { updateScenario } = useAppStore();

  const handleParameterChange = (key: keyof DCFScenario['parameters'], value: number) => {
    updateScenario(scenario.id, s => ({
      ...s,
      parameters: { ...s.parameters, [key]: value }
    }));
  };

  const handleEquityInput = (key: keyof EquityBridgeInputs, value: number) => {
    updateScenario(scenario.id, s => {
      const currentInputs = s.equityBridgeInputs || {
        netDebt: 0, preferredEquity: 0, minorityInterest: 0, cashAndEquivalents: 0, dilutedSharesOutstanding: 0, currentMarketPrice: 0
      };
      return {
        ...s,
        equityBridgeInputs: { ...currentInputs, [key]: value }
      };
    });
  };

  // For live value calculation
  const getLiveEV = (waccOverride?: number, growthOverride?: number, taxOverride?: number) => {
    try {
      const copy = { ...scenario, parameters: { ...scenario.parameters } };
      if (waccOverride !== undefined) copy.parameters.discountRate = waccOverride;
      if (growthOverride !== undefined) copy.parameters.perpetuityRate = growthOverride;
      if (taxOverride !== undefined) copy.parameters.corporateTaxRate = taxOverride;
      return calculateDCF(copy).enterpriseValue;
    } catch {
      return 0;
    }
  };

  const p = scenario.parameters;
  const eq = scenario.equityBridgeInputs || {
    netDebt: 0, preferredEquity: 0, minorityInterest: 0, cashAndEquivalents: 0, dilutedSharesOutstanding: 0, currentMarketPrice: 0
  };

  return (
    <div className="w-full bg-[var(--bg-surface-2)] border-l border-[var(--border-subtle)] h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-2 text-[var(--text-primary)]">
        <Settings2 size={18} />
        <h3 className="font-medium">Assumptions</h3>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-6">
        <div>
          <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-4">DCF Parameters</h4>
          
          <ParameterSlider
            label="WACC (Discount Rate)"
            value={p.discountRate}
            min={1} max={50} step={0.1} unit="%"
            onChange={(val) => handleParameterChange('discountRate', val)}
            liveValue={getLiveEV(p.discountRate)}
            liveCurrency={scenario.currency}
            warning={p.discountRate <= p.perpetuityRate}
            helperText={p.discountRate <= p.perpetuityRate ? 'WACC must be > Growth Rate' : undefined}
          />
          
          <ParameterSlider
            label="Terminal Growth Rate"
            value={p.perpetuityRate}
            min={0} max={15} step={0.1} unit="%"
            onChange={(val) => handleParameterChange('perpetuityRate', val)}
            liveValue={getLiveEV(undefined, p.perpetuityRate)}
            liveCurrency={scenario.currency}
          />
          
          <ParameterSlider
            label="Corporate Tax Rate"
            value={p.corporateTaxRate}
            min={0} max={60} step={0.5} unit="%"
            onChange={(val) => handleParameterChange('corporateTaxRate', val)}
            liveValue={getLiveEV(undefined, undefined, p.corporateTaxRate)}
            liveCurrency={scenario.currency}
          />
        </div>

        <div className="h-px bg-[var(--border-subtle)] w-full"></div>

        <div>
          <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-4">Equity Bridge Inputs</h4>
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput label="Gross Debt" value={eq.netDebt} currency={scenario.currency} onChange={v => handleEquityInput('netDebt', v)} />
            <CurrencyInput label="Cash & Equiv." value={eq.cashAndEquivalents} currency={scenario.currency} onChange={v => handleEquityInput('cashAndEquivalents', v)} />
            <CurrencyInput label="Preferred Equity" value={eq.preferredEquity} currency={scenario.currency} onChange={v => handleEquityInput('preferredEquity', v)} />
            <CurrencyInput label="Minority Interest" value={eq.minorityInterest} currency={scenario.currency} onChange={v => handleEquityInput('minorityInterest', v)} />
            
            <div className="col-span-2 pt-2">
              <CurrencyInput label="Diluted Shares Out." value={eq.dilutedSharesOutstanding} currency="" onChange={v => handleEquityInput('dilutedSharesOutstanding', v)} />
            </div>
            <div className="col-span-2">
              <CurrencyInput label="Current Market Price" value={eq.currentMarketPrice} currency={scenario.currency} onChange={v => handleEquityInput('currentMarketPrice', v)} />
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)] w-full"></div>

        <div>
          <h4 className="text-label text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-2">Notes</h4>
          <textarea 
            value={scenario.notes || ''}
            onChange={(e) => updateScenario(scenario.id, s => ({ ...s, notes: e.target.value }))}
            placeholder="Add markdown notes here..."
            className="w-full h-32 bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors text-body-secondary resize-none"
          />
        </div>
      </div>
    </div>
  );
};

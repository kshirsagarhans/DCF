import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../../store';
import { calculateDCF } from '../lib/fcf';
import { calculateEquityBridge } from '../lib/equityBridge';
import { MetricCard } from '../../../shared/components/MetricCard';
import { DataTable } from '../../../shared/components/DataTable';
import { AssumptionsPanel } from './AssumptionsPanel';
import { ValueBridgeChart } from './ValueBridgeChart';
import { ValuationCompositionChart } from './ValuationCompositionChart';
import { formatCurrency, formatNumber } from '../../../shared/utils/format';
import { DollarSign, Activity, PieChart, Percent, Building } from 'lucide-react';

export const DCFResultsTab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { scenarios } = useAppStore();
  const scenario = scenarios.find(s => s.id === id);

  if (!scenario) return <div className="p-8">Scenario not found.</div>;

  const dcfResults = useMemo(() => {
    try {
      return calculateDCF(scenario);
    } catch (e) {
      return null;
    }
  }, [scenario]);

  const equityResults = useMemo(() => {
    if (!dcfResults || !scenario.equityBridgeInputs) return null;
    const hasInputs = Object.values(scenario.equityBridgeInputs).some(v => v > 0);
    if (!hasInputs) return null;
    return calculateEquityBridge(dcfResults.enterpriseValue, scenario.equityBridgeInputs);
  }, [dcfResults, scenario.equityBridgeInputs]);

  if (!dcfResults) {
    const hasAnyData = Object.keys(scenario.ebitdaData).length > 0;
    return (
      <div className="flex h-full -m-6 animate-fade-in">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center justify-center gap-6">
          <div className="max-w-lg text-center">
            <div className="text-[var(--accent-primary)] mb-4 flex justify-center">
              <Activity size={48} />
            </div>
            <h2 className="text-section-header font-display mb-3 text-[var(--text-primary)]">
              {hasAnyData ? 'Invalid DCF Parameters' : 'No Financial Data Yet'}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {hasAnyData
                ? 'Check that WACC > Terminal Growth Rate, and that all parameters are within valid ranges.'
                : 'Add historical EBITDA, D&A, CapEx, and Net Working Capital data in the Financial Inputs tab to generate your DCF model.'}
            </p>
            <div className="flex flex-col gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-left text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">Quick checklist:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Go to <strong>Financial Inputs</strong> tab and enter at least 3 forecast years of EBITDA</li>
                <li>Ensure <strong>WACC</strong> is strictly greater than the <strong>Terminal Growth Rate</strong></li>
                <li>Set WACC between 1% and 100%, Tax Rate between 0% and 60%</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-[350px] shrink-0 hidden xl:block border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <AssumptionsPanel scenario={scenario} />
        </div>
      </div>
    );
  }

  // Prepare table data
  const tableColumns = [
    { id: 'year', header: 'Year', align: 'left' as const },
    { id: 'ebitda', header: 'EBITDA', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'da', header: 'D&A', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'ebit', header: 'EBIT', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'nopat', header: 'NOPAT', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'capex', header: 'CapEx', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'deltaNWC', header: 'Δ NWC', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'fcf', header: 'FCF', cell: ({ value }: any) => formatNumber(value), align: 'right' as const },
    { id: 'discountFactor', header: 'Discount Factor', cell: ({ value }: any) => value.toFixed(3), align: 'right' as const },
    { id: 'presentValue', header: 'Present Value', cell: ({ value }: any) => formatCurrency(value, scenario.currency, true), align: 'right' as const },
  ];

  // Prepare waterfall chart data
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
    <div className="flex h-full -m-6 animate-fade-in">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        
        {/* Top Metric Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Enterprise Value"
            value={dcfResults.enterpriseValue}
            format="currency"
            currencyCode={scenario.currency}
            icon={Building}
          />
          {equityResults ? (
            <MetricCard
              title="Equity Value"
              value={equityResults.equityValue}
              format="currency"
              currencyCode={scenario.currency}
              icon={DollarSign}
            />
          ) : (
            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] border-dashed rounded-md p-4 flex items-center justify-center text-center cursor-pointer hover:bg-[var(--bg-surface-3)] transition-colors">
              <span className="text-body-secondary text-[var(--accent-secondary)]">Enter balance sheet data to see Equity Value →</span>
            </div>
          )}
          {equityResults ? (
            <MetricCard
              title="Intrinsic Share Price"
              value={equityResults.intrinsicSharePrice}
              format="currency"
              currencyCode={scenario.currency}
              delta={equityResults.upside}
              deltaLabel="vs Market"
              icon={Activity}
              color={equityResults.upside > 0 ? 'var(--positive)' : 'var(--negative)'}
            />
          ) : (
            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] border-dashed rounded-md p-4 flex items-center justify-center text-center cursor-pointer hover:bg-[var(--bg-surface-3)] transition-colors">
              <span className="text-body-secondary text-[var(--accent-secondary)]">Requires shares outstanding →</span>
            </div>
          )}
          <MetricCard
            title="Terminal Value %"
            value={dcfResults.terminalValuePct}
            format="percentage"
            icon={PieChart}
            color={dcfResults.terminalValuePct > 70 ? 'var(--accent-amber)' : 'var(--text-primary)'}
            infoTooltip="Percentage of EV derived from the Terminal Value. >70% may indicate high sensitivity to long-term assumptions."
          />
          <MetricCard
            title="WACC"
            value={scenario.parameters.discountRate}
            format="percentage"
            icon={Percent}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[350px]">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col shadow-card">
            <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Value Bridge</h3>
            <div className="flex-1 min-h-0">
              <ValueBridgeChart data={waterfallData} currency={scenario.currency} />
            </div>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col shadow-card">
            <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Valuation Composition</h3>
            <div className="flex-1 min-h-0">
              <ValuationCompositionChart 
                projectionsPV={dcfResults.projectionsPV} 
                terminalValuePV={dcfResults.terminalValuePV} 
                currency={scenario.currency} 
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-card">
          <h3 className="text-card-title text-[var(--text-primary)] font-medium mb-4">Free Cash Flow Build</h3>
          <DataTable data={dcfResults.fcfRows} columns={tableColumns} />
        </div>

      </div>

      <div className="w-[350px] shrink-0 hidden xl:block border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <AssumptionsPanel scenario={scenario} />
      </div>
    </div>
  );
};

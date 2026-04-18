import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { formatCurrency } from '../../../shared/utils/format';
import { EquityBridgeInputs, EquityBridgeOutput } from '../../../types/dcf';

interface EquityWaterfallChartProps {
  ev: number;
  inputs: EquityBridgeInputs;
  output: EquityBridgeOutput;
  currency: string;
}

export const EquityWaterfallChart: React.FC<EquityWaterfallChartProps> = ({ ev, inputs, output, currency }) => {
  // Build waterfall segments:
  // 1. EV (start: 0, end: EV)
  // 2. Net Debt (start: EV - netDebt, end: EV) -> Wait, if it's minus, the bar should go down from EV
  
  let current = ev;
  const data = [];

  data.push({
    name: 'Enterprise Value',
    start: 0,
    end: current,
    value: ev,
    color: 'var(--accent-primary)'
  });

  if (inputs.netDebt !== 0) {
    const next = current - inputs.netDebt;
    data.push({
      name: 'Net Debt',
      start: Math.min(current, next),
      end: Math.max(current, next),
      value: -inputs.netDebt,
      color: inputs.netDebt > 0 ? 'var(--negative)' : 'var(--positive)'
    });
    current = next;
  }

  if (inputs.preferredEquity !== 0) {
    const next = current - inputs.preferredEquity;
    data.push({
      name: 'Pref. Equity',
      start: Math.min(current, next),
      end: Math.max(current, next),
      value: -inputs.preferredEquity,
      color: 'var(--negative)'
    });
    current = next;
  }

  if (inputs.minorityInterest !== 0) {
    const next = current - inputs.minorityInterest;
    data.push({
      name: 'Minority Int.',
      start: Math.min(current, next),
      end: Math.max(current, next),
      value: -inputs.minorityInterest,
      color: 'var(--negative)'
    });
    current = next;
  }

  if (inputs.cashAndEquivalents !== 0) {
    const next = current + inputs.cashAndEquivalents;
    data.push({
      name: 'Cash',
      start: Math.min(current, next),
      end: Math.max(current, next),
      value: inputs.cashAndEquivalents,
      color: 'var(--positive)'
    });
    current = next;
  }

  data.push({
    name: 'Equity Value',
    start: 0,
    end: current,
    value: current,
    color: 'var(--accent-secondary)'
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-1">{data.name}</p>
          <p className={`text-body-primary font-medium data-number ${data.value >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {data.value >= 0 ? '+' : ''}{formatCurrency(data.value, currency, true)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
            axisLine={{ stroke: 'var(--border-strong)' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(val) => formatCurrency(val, currency, true).replace('.0', '')}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-2)' }} />
          
          <Bar dataKey="start" stackId="stack" fill="transparent" />
          <Bar dataKey="end" stackId="stack" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../../shared/utils/format';

interface TornadoChartProps {
  data: {
    name: string;
    lowImpact: number;
    highImpact: number;
    baseEV: number;
  }[];
  currency: string;
}

export const TornadoChart: React.FC<TornadoChartProps> = ({ data, currency }) => {
  if (!data || data.length === 0) return null;
  const baseEV = data[0]?.baseEV || 0;

  // Transform data for Recharts: we need left bar (negative impact, extends left from base)
  // and right bar (positive impact, extends right from base)
  const chartData = data.map(item => {
    // Both impacts are absolute EV values. We want to show delta from base.
    const lowDelta = item.lowImpact - baseEV;
    const highDelta = item.highImpact - baseEV;
    
    // The bar extending left should be the one with the negative delta
    const negativeDelta = Math.min(lowDelta, highDelta);
    const positiveDelta = Math.max(lowDelta, highDelta);

    return {
      name: item.name,
      negativeDelta,
      positiveDelta,
      baseEV,
      lowImpact: item.lowImpact,
      highImpact: item.highImpact
    };
  });

  // Sort by absolute size of the range (largest range at top)
  chartData.sort((a, b) => (b.positiveDelta - b.negativeDelta) - (a.positiveDelta - a.negativeDelta));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-2 font-medium">{data.name} Impact</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">Low Case EV:</span>
              <span className="data-number text-[var(--negative)]">{formatCurrency(data.lowImpact, currency, true)}</span>
            </div>
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">Base Case EV:</span>
              <span className="data-number text-[var(--text-primary)]">{formatCurrency(data.baseEV, currency, true)}</span>
            </div>
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">High Case EV:</span>
              <span className="data-number text-[var(--positive)]">{formatCurrency(data.highImpact, currency, true)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
          <XAxis 
            type="number" 
            tickFormatter={(val) => formatCurrency(val, currency, true).replace('.0', '')}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-2)' }} />
          <ReferenceLine x={0} stroke="var(--text-secondary)" strokeDasharray="3 3" />
          
          <Bar dataKey="negativeDelta" fill="var(--negative)" radius={[4, 0, 0, 4]} barSize={24} />
          <Bar dataKey="positiveDelta" fill="var(--positive)" radius={[0, 4, 4, 0]} barSize={24} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, Cell, ReferenceLine } from 'recharts';
import { formatCurrency, formatPercentage } from '../../../shared/utils/format';

interface CompsBubbleChartProps {
  data: any[];
}

export const CompsBubbleChart: React.FC<CompsBubbleChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // X = Growth (e.g. revenue growth or assumed) -> wait, we only have EV/EBITDA, P/E, Margin
  // Let's plot Margin (X) vs EV/EBITDA (Y), Size = Market Cap

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-1 font-bold">{data.ticker}</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">EV/EBITDA:</span>
              <span className="data-number text-[var(--text-primary)]">{data.evToEbitda.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">EBITDA Margin:</span>
              <span className="data-number text-[var(--text-primary)]">{formatPercentage(data.margin * 100)}</span>
            </div>
            <div className="flex justify-between gap-4 text-label">
              <span className="text-[var(--text-tertiary)]">Market Cap:</span>
              <span className="data-number text-[var(--text-primary)]">{formatCurrency(data.mktCap, data.currency, true)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate medians for reference lines
  const medianEvEbitda = data.map(d => d.evToEbitda).sort((a,b) => a-b)[Math.floor(data.length/2)];
  const medianMargin = data.map(d => d.margin).sort((a,b) => a-b)[Math.floor(data.length/2)];

  return (
    <div className="h-full w-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis 
            dataKey="margin" 
            name="EBITDA Margin" 
            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            label={{ value: 'EBITDA Margin (%) →', position: 'bottom', fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis 
            dataKey="evToEbitda" 
            name="EV / EBITDA" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            label={{ value: 'EV / EBITDA (x) →', angle: -90, position: 'left', fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <ZAxis dataKey="mktCap" range={[100, 1000]} name="Market Cap" />
          
          <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          <ReferenceLine y={medianEvEbitda} stroke="var(--border-strong)" strokeDasharray="3 3" />
          <ReferenceLine x={medianMargin} stroke="var(--border-strong)" strokeDasharray="3 3" />

          <Scatter name="Peers" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isTarget ? 'var(--accent-primary)' : 'var(--text-tertiary)'} 
                opacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

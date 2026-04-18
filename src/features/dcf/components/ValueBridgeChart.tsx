import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { formatCurrency } from '../../../shared/utils/format';

interface ValueBridgeChartProps {
  data: {
    name: string;
    pv: number;
    isProjected?: boolean;
    isTerminal?: boolean;
  }[];
  currency: string;
}

export const ValueBridgeChart: React.FC<ValueBridgeChartProps> = ({ data, currency }) => {
  // We need to transform data into waterfall format: start, end
  let cumulative = 0;
  const waterfallData = data.map(item => {
    const start = cumulative;
    cumulative += item.pv;
    const end = cumulative;
    return {
      name: item.name,
      pv: item.pv,
      start,
      end,
      isProjected: item.isProjected,
      isTerminal: item.isTerminal
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-1">{data.name}</p>
          <p className="text-body-primary font-medium text-[var(--text-primary)] data-number">
            + {formatCurrency(data.pv, currency, true)}
          </p>
          <p className="text-label text-[var(--text-tertiary)] mt-1 data-number">
            Cumulative: {formatCurrency(data.end, currency, true)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
          <Bar dataKey="pv" stackId="stack" radius={[2, 2, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.isTerminal 
                    ? 'var(--accent-secondary)' 
                    : entry.isProjected 
                      ? 'var(--accent-primary)' 
                      : 'var(--text-tertiary)'
                } 
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

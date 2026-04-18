import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../../shared/utils/format';

interface ReturnsProfileChartProps {
  cashFlows: number[];
  currency: string;
}

export const ReturnsProfileChart: React.FC<ReturnsProfileChartProps> = ({ cashFlows, currency }) => {
  const data = cashFlows.map((cf, index) => ({
    name: index === 0 ? 'Year 0' : `Year ${index}`,
    value: cf
  }));

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
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-2)' }} />
          
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'var(--positive)' : 'var(--negative)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

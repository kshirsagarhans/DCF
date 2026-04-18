import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../../../shared/utils/format';

interface ValuationCompositionChartProps {
  projectionsPV: number;
  terminalValuePV: number;
  currency: string;
}

export const ValuationCompositionChart: React.FC<ValuationCompositionChartProps> = ({ 
  projectionsPV, 
  terminalValuePV, 
  currency 
}) => {
  const data = [
    { name: 'PV of Projections', value: projectionsPV, color: 'var(--accent-primary)' },
    { name: 'PV of Terminal Value', value: terminalValuePV, color: 'var(--accent-secondary)' }
  ];

  const total = projectionsPV + terminalValuePV;
  const terminalPct = total > 0 ? (terminalValuePV / total) * 100 : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = (data.value / total) * 100;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.name}
          </p>
          <div className="flex items-end gap-3 mt-1">
            <p className="text-body-primary font-medium text-[var(--text-primary)] data-number">
              {formatCurrency(data.value, currency, true)}
            </p>
            <p className="text-label text-[var(--accent-amber)] font-medium">
              {formatPercentage(pct)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full min-h-[300px] relative">
      {terminalPct > 70 && (
        <div className="absolute top-0 right-0 bg-[#f5a6231a] text-[var(--accent-amber)] border border-[var(--accent-amber)] px-2 py-1 rounded text-label font-medium z-10">
          High TV Dependency: {formatPercentage(terminalPct)}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-label text-[var(--text-secondary)] ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

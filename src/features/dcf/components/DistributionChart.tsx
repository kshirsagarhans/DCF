import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../../shared/utils/format';
import { MonteCarloResults } from '../../../types/dcf';

interface DistributionChartProps {
  results: MonteCarloResults;
  currency: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ results, currency }) => {
  // We need to bucket the values into a histogram
  const chartData = useMemo(() => {
    if (!results || results.evDistribution.length === 0) return [];
    
    // Sort values to compute percentiles
    const sorted = [...results.evDistribution].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Create ~50 buckets
    const bucketCount = 50;
    const bucketSize = (max - min) / bucketCount;
    
    const buckets = new Array(bucketCount).fill(0).map((_, i) => ({
      name: min + i * bucketSize,
      displayMax: min + (i + 1) * bucketSize,
      count: 0
    }));
    
    sorted.forEach(val => {
      let index = Math.floor((val - min) / bucketSize);
      if (index >= bucketCount) index = bucketCount - 1; // Put max value in the last bucket
      if (index >= 0) buckets[index].count++;
    });
    
    return buckets;
  }, [results]);

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-surface-3)] border border-[var(--border-strong)] p-3 rounded shadow-lg">
          <p className="text-label text-[var(--text-secondary)] mb-1">
            Range: {formatCurrency(data.name, currency, true).replace('.0', '')} - {formatCurrency(data.displayMax, currency, true).replace('.0', '')}
          </p>
          <p className="text-body-primary font-medium text-[var(--text-primary)]">
            Frequency: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis 
            dataKey="name" 
            tickFormatter={(val) => formatCurrency(val, currency, true).replace('.0', '')}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
            axisLine={{ stroke: 'var(--border-strong)' }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-2)' }} />
          
          <Bar dataKey="count" fill="var(--accent-primary)" radius={[2, 2, 0, 0]} />
          
          <ReferenceLine x={results.p50} stroke="var(--text-primary)" strokeDasharray="3 3" label={{ position: 'top', value: 'Median', fill: 'var(--text-primary)', fontSize: 10 }} />
          <ReferenceLine x={results.p10} stroke="var(--negative)" strokeDasharray="3 3" label={{ position: 'top', value: '10th %', fill: 'var(--negative)', fontSize: 10 }} />
          <ReferenceLine x={results.p90} stroke="var(--positive)" strokeDasharray="3 3" label={{ position: 'top', value: '90th %', fill: 'var(--positive)', fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercentage, formatMultiple, formatNumber } from '../utils/format';

interface MetricCardProps {
  title: string;
  value: number;
  format: 'currency' | 'percentage' | 'multiple' | 'number';
  currencyCode?: string;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: LucideIcon;
  color?: string; // CSS variable or class
  infoTooltip?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  value,
  format,
  currencyCode = 'USD',
  subtitle,
  delta,
  deltaLabel,
  icon: Icon,
  color,
  infoTooltip,
  onClick
}) => {
  let formattedValue = '';
  switch (format) {
    case 'currency':
      formattedValue = formatCurrency(value, currencyCode, true);
      break;
    case 'percentage':
      formattedValue = formatPercentage(value);
      break;
    case 'multiple':
      formattedValue = formatMultiple(value);
      break;
    case 'number':
      formattedValue = formatNumber(value);
      break;
  }

  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <div 
      className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md p-4 shadow-card hover:border-[var(--border-strong)] transition-all duration-250 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-body-secondary text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
          {title}
          {infoTooltip && (
            <span className="text-[var(--text-tertiary)] cursor-help" title={infoTooltip}>ⓘ</span>
          )}
        </h3>
        {Icon && <Icon size={18} className="text-[var(--text-tertiary)]" />}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div 
          className="text-hero-metric display-font tracking-tight leading-none"
          style={{ color: color || 'var(--text-primary)' }}
        >
          {formattedValue}
        </div>
      </div>

      {(subtitle || delta !== undefined) && (
        <div className="mt-3 flex items-center gap-2 text-label">
          {delta !== undefined && (
            <span className={`flex items-center font-medium ${isPositive ? 'text-[var(--positive)]' : isNegative ? 'text-[var(--negative)]' : 'text-[var(--text-tertiary)]'}`}>
              {isPositive && <ArrowUpRight size={14} className="mr-0.5" />}
              {isNegative && <ArrowDownRight size={14} className="mr-0.5" />}
              {Math.abs(delta)}%
            </span>
          )}
          {(deltaLabel || subtitle) && (
            <span className="text-[var(--text-tertiary)]">
              {deltaLabel || subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

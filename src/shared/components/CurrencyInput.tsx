import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

interface CurrencyInputProps {
  value: number;
  currency: string;
  onChange: (value: number) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  currency,
  onChange,
  placeholder,
  label,
  error,
  className = '',
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const displayValue = isFocused 
    ? localValue 
    : isNaN(value) || value === 0 && localValue === '' 
      ? '' 
      : formatCurrency(value, currency, false);

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-label text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}
      <input
        type={isFocused ? "number" : "text"}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          bg-[var(--bg-surface-3)] text-[var(--text-primary)] data-number 
          border rounded px-3 py-1.5 outline-none transition-colors w-full
          ${error 
            ? 'border-[var(--accent-coral)] focus:border-[var(--accent-coral)] focus:ring-1 focus:ring-[var(--accent-coral)]' 
            : 'border-[var(--border-default)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
};

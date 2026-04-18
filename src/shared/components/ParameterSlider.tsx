import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/format';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  helperText?: string;
  warning?: boolean;
  liveValue?: number; // Real-time EV
  liveCurrency?: string;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  helperText,
  warning,
  liveValue,
  liveCurrency = 'USD'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  
  // Debounce the actual onChange callback
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalValue(val);
    
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      onChange(val);
    }, 80); // 80ms debounce as requested
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (val < min) val = min;
    if (val > max) val = max;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-body-secondary text-[var(--text-secondary)] font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={localValue}
            onChange={handleNumberInputChange}
            step={step}
            min={min}
            max={max}
            className={`w-16 bg-[var(--bg-surface-3)] text-right text-body-primary font-medium rounded px-2 py-1 outline-none border focus:border-[var(--accent-primary)] transition-colors data-number ${warning ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]' : 'border-[var(--border-default)]'}`}
          />
          <span className="text-[var(--text-tertiary)]">{unit}</span>
        </div>
      </div>
      
      <div className="relative pt-2 pb-1">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={localValue}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-1 bg-[var(--border-strong)] rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]"
          style={{
            background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((localValue - min) / (max - min)) * 100}%, var(--border-strong) ${((localValue - min) / (max - min)) * 100}%, var(--border-strong) 100%)`
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${warning ? 'var(--accent-amber)' : 'var(--text-primary)'};
            cursor: pointer;
            border: 2px solid var(--bg-surface);
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
            transition: transform 0.1s;
          }
          input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
        `}</style>
      </div>

      <div className="flex justify-between items-center mt-1 min-h-[20px]">
        <div className={`text-label ${warning ? 'text-[var(--accent-amber)]' : 'text-[var(--text-tertiary)]'}`}>
          {helperText}
        </div>
        
        {liveValue !== undefined && isDragging && (
          <div className="text-label text-[var(--accent-primary)] font-medium animate-pulse flex gap-1 items-center">
            <span>EV:</span>
            <span className="data-number">{formatCurrency(liveValue, liveCurrency, true)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

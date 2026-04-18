import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-surface-3)] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-surface-3)] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--bg-surface-3)] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-surface-3)] border-y-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-50 px-2.5 py-1.5 text-label font-medium bg-[var(--bg-surface-3)] text-[var(--text-primary)] rounded shadow-lg max-w-[240px] w-max whitespace-normal ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div className={`absolute border-[5px] ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
};

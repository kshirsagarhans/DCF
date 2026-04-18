import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'md',
  closeOnBackdropClick = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeOnBackdropClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-[var(--bg-surface)] w-full ${widthClasses[width]} rounded-lg shadow-xl border border-[var(--border-strong)] flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 id="modal-title" className="text-card-title text-[var(--text-primary)] font-medium">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-surface-2)]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg border animate-slide-in-right min-w-[250px]
              ${toast.type === 'success' ? 'bg-[var(--bg-surface)] border-[var(--positive)]' : ''}
              ${toast.type === 'error' ? 'bg-[var(--bg-surface)] border-[var(--negative)]' : ''}
              ${toast.type === 'warning' ? 'bg-[var(--bg-surface)] border-[var(--accent-amber)]' : ''}
              ${toast.type === 'info' ? 'bg-[var(--bg-surface)] border-[var(--accent-secondary)]' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="text-[var(--positive)]" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-[var(--negative)]" size={20} />}
            {toast.type === 'warning' && <AlertTriangle className="text-[var(--accent-amber)]" size={20} />}
            {toast.type === 'info' && <Info className="text-[var(--accent-secondary)]" size={20} />}
            
            <span className="text-body-secondary text-[var(--text-primary)] font-medium flex-1">
              {toast.message}
            </span>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

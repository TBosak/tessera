import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const variantClasses = {
    success: 'bg-accent text-ink border-ink',
    error: 'bg-secondary text-paper border-ink',
    warning: 'bg-yellow-400 text-ink border-ink',
    info: 'bg-primary text-paper border-ink'
  };

  return (
    <div
      className={cn(
        'card p-4 min-w-[300px] max-w-[400px] shadow-brutal-lg',
        variantClasses[toast.variant]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg leading-none hover:opacity-70"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Export a simple Toaster component for use in App
export function Toaster() {
  return null; // The ToastProvider handles rendering
}
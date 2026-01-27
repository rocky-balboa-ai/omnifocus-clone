'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience methods
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: 5000 }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast container
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const { theme } = useAppStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
          theme={theme}
        />
      ))}
    </div>
  );
}

// Individual toast
interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
  theme: 'light' | 'dark';
}

function ToastItem({ toast, onRemove, theme }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 150);
  };

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/30',
    },
    error: {
      icon: AlertCircle,
      bgColor: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100',
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/30',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
    },
    info: {
      icon: Info,
      bgColor: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm',
        config.bgColor,
        config.borderColor,
        isExiting
          ? 'animate-out fade-out slide-out-to-right duration-150'
          : 'animate-in fade-in slide-in-from-right duration-200'
      )}
    >
      <Icon size={20} className={clsx(config.iconColor, 'shrink-0 mt-0.5')} />

      <div className="flex-1 min-w-0">
        <p className={clsx(
          'font-medium text-sm',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={clsx(
            'text-sm mt-0.5',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              handleRemove();
            }}
            className={clsx(
              'text-sm font-medium mt-2',
              config.iconColor
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleRemove}
        className={clsx(
          'p-1 rounded shrink-0 transition-colors',
          theme === 'dark'
            ? 'text-gray-500 hover:text-white hover:bg-white/10'
            : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Standalone toast for simple use cases (without context)
interface SimpleToastProps {
  type: ToastType;
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function SimpleToast({ type, title, message, isVisible, onClose }: SimpleToastProps) {
  const { theme } = useAppStore();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const config = {
    success: { icon: CheckCircle2, color: 'text-green-500', bg: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100' },
    info: { icon: Info, color: 'text-blue-500', bg: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100' },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-right duration-200">
      <div className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border',
        config.bg,
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <Icon size={18} className={config.color} />
        <div>
          <p className={clsx(
            'font-medium text-sm',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </p>
          {message && (
            <p className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {message}
            </p>
          )}
        </div>
        <button onClick={onClose} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

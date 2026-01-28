'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useAppStore } from '@/stores/app.store';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const { theme } = useAppStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={clsx(
          'relative w-full rounded-2xl shadow-2xl border overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200',
          SIZE_CLASSES[size],
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200',
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className={clsx(
            'flex items-center justify-between px-6 py-4 border-b',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className={clsx(
                    'text-lg font-semibold',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className={clsx(
                    'text-sm mt-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal body
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  );
}

// Modal footer
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center justify-end gap-3 px-6 py-4 border-t',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200',
      className
    )}>
      {children}
    </div>
  );
}

// Confirmation modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const { theme } = useAppStore();

  const confirmButtonClasses = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    default: 'bg-omnifocus-purple hover:bg-omnifocus-purple/90 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <ModalBody>
        <h3 className={clsx(
          'text-lg font-semibold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </h3>
        <p className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          {message}
        </p>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            theme === 'dark'
              ? 'text-gray-300 hover:bg-omnifocus-surface'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            confirmButtonClasses[variant],
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// Alert modal (just info, no confirm)
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonLabel?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonLabel = 'OK',
  variant = 'info',
}: AlertModalProps) {
  const { theme } = useAppStore();

  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <ModalBody className="text-center">
        <div className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
        )}>
          <span className={clsx('text-2xl', iconColors[variant])}>
            {variant === 'success' ? '✓' : variant === 'error' ? '✕' : variant === 'warning' ? '!' : 'i'}
          </span>
        </div>
        <h3 className={clsx(
          'text-lg font-semibold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </h3>
        <p className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          {message}
        </p>
      </ModalBody>
      <ModalFooter className="justify-center">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
        >
          {buttonLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// Hook for managing modal state
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

// Modal context for nested modals
interface ModalContextType {
  openModals: string[];
  registerModal: (id: string) => void;
  unregisterModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModals, setOpenModals] = useState<string[]>([]);

  const registerModal = useCallback((id: string) => {
    setOpenModals(prev => [...prev, id]);
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setOpenModals(prev => prev.filter(m => m !== id));
  }, []);

  return (
    <ModalContext.Provider value={{ openModals, registerModal, unregisterModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  return useContext(ModalContext);
}

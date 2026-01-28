'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { X } from 'lucide-react';
import clsx from 'clsx';

type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASSES: Record<DrawerPosition, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[480px]',
    full: 'w-full',
  },
  right: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[480px]',
    full: 'w-full',
  },
  top: {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80',
    xl: 'h-96',
    full: 'h-full',
  },
  bottom: {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80',
    xl: 'h-96',
    full: 'h-full',
  },
};

const POSITION_CLASSES: Record<DrawerPosition, string> = {
  left: 'inset-y-0 left-0',
  right: 'inset-y-0 right-0',
  top: 'inset-x-0 top-0',
  bottom: 'inset-x-0 bottom-0',
};

const ANIMATION_CLASSES: Record<DrawerPosition, { enter: string; exit: string }> = {
  left: {
    enter: 'animate-in slide-in-from-left duration-300',
    exit: 'animate-out slide-out-to-left duration-200',
  },
  right: {
    enter: 'animate-in slide-in-from-right duration-300',
    exit: 'animate-out slide-out-to-right duration-200',
  },
  top: {
    enter: 'animate-in slide-in-from-top duration-300',
    exit: 'animate-out slide-out-to-top duration-200',
  },
  bottom: {
    enter: 'animate-in slide-in-from-bottom duration-300',
    exit: 'animate-out slide-out-to-bottom duration-200',
  },
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  size?: DrawerSize;
  title?: string;
  description?: string;
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  position = 'right',
  size = 'md',
  title,
  description,
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className,
}: DrawerProps) {
  const { theme } = useAppStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHorizontal = position === 'left' || position === 'right';

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={clsx(
          'absolute flex flex-col shadow-2xl',
          POSITION_CLASSES[position],
          isHorizontal ? SIZE_CLASSES[position][size] : 'w-full',
          !isHorizontal ? SIZE_CLASSES[position][size] : 'h-full',
          ANIMATION_CLASSES[position].enter,
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200',
          position === 'left' && 'border-r',
          position === 'right' && 'border-l',
          position === 'top' && 'border-b',
          position === 'bottom' && 'border-t',
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className={clsx(
            'flex items-start justify-between px-6 py-4 border-b shrink-0',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <div>
              {title && (
                <h2 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={clsx(
                  'text-sm mt-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className={clsx(
                  'p-2 -m-2 rounded-lg transition-colors',
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
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={clsx(
            'px-6 py-4 border-t shrink-0',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Drawer with form handling
interface DrawerFormProps extends Omit<DrawerProps, 'footer'> {
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
}

export function DrawerForm({
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isValid = true,
  onClose,
  children,
  ...props
}: DrawerFormProps) {
  const { theme } = useAppStore();

  return (
    <Drawer
      {...props}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !isValid}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-omnifocus-purple text-white',
              (isSubmitting || !isValid) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      }
    >
      {children}
    </Drawer>
  );
}

// Confirmation drawer
interface ConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDrawer({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDrawerProps) {
  const { theme } = useAppStore();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      size="sm"
      showClose={false}
    >
      <div className="p-6">
        <h3 className={clsx(
          'text-lg font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </h3>
        <p className={clsx(
          'mt-2 text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {message}
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-bg'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-omnifocus-purple text-white hover:bg-purple-600',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

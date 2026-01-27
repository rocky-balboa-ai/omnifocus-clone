'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
  className,
}: TooltipProps) {
  const { theme } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let newPosition = position;

      if (position === 'top' && triggerRect.top - tooltipRect.height < 8) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > window.innerHeight - 8) {
        newPosition = 'top';
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 8) {
        newPosition = 'right';
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > window.innerWidth - 8) {
        newPosition = 'left';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-current border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-current border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-current border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className={clsx('relative inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={clsx(
            'absolute z-50 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
            'animate-in fade-in zoom-in-95 duration-150',
            positionClasses[actualPosition],
            theme === 'dark'
              ? 'bg-gray-900 text-white border border-gray-700'
              : 'bg-gray-900 text-white'
          )}
        >
          {content}
          <div
            className={clsx(
              'absolute w-0 h-0 border-4',
              arrowClasses[actualPosition],
              theme === 'dark' ? 'text-gray-900' : 'text-gray-900'
            )}
          />
        </div>
      )}
    </div>
  );
}

// Info tooltip with icon
interface InfoTooltipProps {
  content: React.ReactNode;
  iconSize?: number;
  className?: string;
}

export function InfoTooltip({ content, iconSize = 14, className }: InfoTooltipProps) {
  const { theme } = useAppStore();

  return (
    <Tooltip content={content}>
      <button
        className={clsx(
          'inline-flex items-center justify-center rounded-full',
          theme === 'dark'
            ? 'text-gray-500 hover:text-gray-400'
            : 'text-gray-400 hover:text-gray-500',
          className
        )}
        style={{ width: iconSize + 4, height: iconSize + 4 }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="8" r="7" />
          <line x1="8" y1="11" x2="8" y2="8" />
          <line x1="8" y1="5" x2="8" y2="5" />
        </svg>
      </button>
    </Tooltip>
  );
}

// Tooltip that shows on text truncation
interface TruncateTooltipProps {
  text: string;
  maxWidth?: number | string;
  className?: string;
}

export function TruncateTooltip({ text, maxWidth = 200, className }: TruncateTooltipProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  const content = (
    <span
      ref={textRef}
      className={clsx('block truncate', className)}
      style={{ maxWidth }}
    >
      {text}
    </span>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <Tooltip content={text}>
      {content}
    </Tooltip>
  );
}

// Rich content tooltip
interface RichTooltipProps {
  title: string;
  description?: string;
  shortcut?: string[];
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
}

export function RichTooltip({
  title,
  description,
  shortcut,
  children,
  position = 'top',
  className,
}: RichTooltipProps) {
  const { theme } = useAppStore();

  const content = (
    <div className="text-left max-w-xs">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">{title}</span>
        {shortcut && (
          <span className={clsx(
            'flex items-center gap-0.5',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
          )}>
            {shortcut.map((key, i) => (
              <kbd
                key={i}
                className={clsx(
                  'px-1 py-0.5 rounded text-[10px] font-mono',
                  theme === 'dark'
                    ? 'bg-gray-700'
                    : 'bg-gray-700'
                )}
              >
                {key}
              </kbd>
            ))}
          </span>
        )}
      </div>
      {description && (
        <p className={clsx(
          'mt-1 text-xs',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
        )}>
          {description}
        </p>
      )}
    </div>
  );

  return (
    <Tooltip content={content} position={position} className={className} delay={300}>
      {children}
    </Tooltip>
  );
}

// Confirmation tooltip
interface ConfirmTooltipProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
}

export function ConfirmTooltip({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  children,
  position = 'top',
  className,
}: ConfirmTooltipProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  return (
    <div className={clsx('relative inline-flex', className)}>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCancel}
          />
          <div className={clsx(
            'absolute z-50 p-3 rounded-xl shadow-xl border',
            'animate-in fade-in zoom-in-95 duration-150',
            position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
            position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
            position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
            'left-full top-1/2 -translate-y-1/2 ml-2',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <p className={clsx(
              'text-sm mb-3 whitespace-nowrap',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {message}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-omnifocus-surface'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

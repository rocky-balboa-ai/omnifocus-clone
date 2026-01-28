'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  placement?: PopoverPlacement;
  offset?: number;
  showArrow?: boolean;
  openOnHover?: boolean;
  hoverDelay?: number;
  closeOnContentClick?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Popover({
  trigger,
  content,
  placement = 'bottom',
  offset = 8,
  showArrow = false,
  openOnHover = false,
  hoverDelay = 200,
  closeOnContentClick = false,
  className,
  contentClassName,
}: PopoverProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    // Base position calculation
    const [primary, secondary] = placement.split('-') as [string, string | undefined];

    switch (primary) {
      case 'top':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Secondary alignment
    if (secondary === 'start') {
      if (primary === 'top' || primary === 'bottom') {
        left = triggerRect.left;
      } else {
        top = triggerRect.top;
      }
    } else if (secondary === 'end') {
      if (primary === 'top' || primary === 'bottom') {
        left = triggerRect.right - contentRect.width;
      } else {
        top = triggerRect.bottom - contentRect.height;
      }
    }

    // Keep within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, viewportWidth - contentRect.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - contentRect.height - padding));

    setPosition({ top, left });
  }, [placement, offset]);

  // Update position when open
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(updatePosition);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle outside clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        contentRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!openOnHover) {
      setIsOpen(prev => !prev);
    }
  };

  const handleMouseEnter = () => {
    if (openOnHover) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, hoverDelay);
    }
  };

  const handleMouseLeave = () => {
    if (openOnHover) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsOpen(false);
    }
  };

  const handleContentClick = () => {
    if (closeOnContentClick) {
      setIsOpen(false);
    }
  };

  // Get arrow position classes
  const getArrowClasses = () => {
    const [primary] = placement.split('-');
    const arrowBase = clsx(
      'absolute w-2 h-2 rotate-45',
      theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
    );

    switch (primary) {
      case 'top':
        return clsx(arrowBase, 'bottom-[-4px] left-1/2 -translate-x-1/2');
      case 'bottom':
        return clsx(arrowBase, 'top-[-4px] left-1/2 -translate-x-1/2');
      case 'left':
        return clsx(arrowBase, 'right-[-4px] top-1/2 -translate-y-1/2');
      case 'right':
        return clsx(arrowBase, 'left-[-4px] top-1/2 -translate-y-1/2');
      default:
        return arrowBase;
    }
  };

  return (
    <div
      className={clsx('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Content */}
      {isOpen && (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          className={clsx(
            'fixed z-50 rounded-lg shadow-xl border',
            'animate-in fade-in zoom-in-95 duration-150',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200',
            contentClassName
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {showArrow && <div className={getArrowClasses()} />}
          {content}
        </div>
      )}
    </div>
  );
}

// Controlled popover
interface ControlledPopoverProps extends Omit<PopoverProps, 'trigger'> {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export function ControlledPopover({
  isOpen,
  onClose,
  anchorEl,
  content,
  placement = 'bottom',
  offset = 8,
  showArrow = false,
  contentClassName,
}: ControlledPopoverProps) {
  const { theme } = useAppStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position
  useEffect(() => {
    if (!isOpen || !anchorEl || !contentRef.current) return;

    const updatePosition = () => {
      const triggerRect = anchorEl.getBoundingClientRect();
      const contentRect = contentRef.current!.getBoundingClientRect();

      let top = 0;
      let left = 0;

      const [primary] = placement.split('-');

      switch (primary) {
        case 'top':
          top = triggerRect.top - contentRect.height - offset;
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + offset;
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
          left = triggerRect.left - contentRect.width - offset;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
          left = triggerRect.right + offset;
          break;
      }

      // Keep within viewport
      const padding = 8;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      left = Math.max(padding, Math.min(left, viewportWidth - contentRect.width - padding));
      top = Math.max(padding, Math.min(top, viewportHeight - contentRect.height - padding));

      setPosition({ top, left });
    };

    requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen, anchorEl, placement, offset]);

  // Handle escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        anchorEl?.contains(e.target as Node) ||
        contentRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, anchorEl, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={clsx(
        'fixed z-50 rounded-lg shadow-xl border',
        'animate-in fade-in zoom-in-95 duration-150',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200',
        contentClassName
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {content}
    </div>
  );
}

// Simple info popover (hover)
interface InfoPopoverProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: PopoverPlacement;
}

export function InfoPopover({ content, children, placement = 'top' }: InfoPopoverProps) {
  const { theme } = useAppStore();

  return (
    <Popover
      trigger={children}
      placement={placement}
      openOnHover
      hoverDelay={300}
      showArrow
      content={
        <div className={clsx(
          'px-3 py-2 text-sm max-w-xs',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {content}
        </div>
      }
    />
  );
}

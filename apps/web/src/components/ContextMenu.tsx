'use client';

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

// Context for menu state
interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  content: React.ReactNode | null;
}

interface ContextMenuContextType {
  openMenu: (position: { x: number; y: number }, content: React.ReactNode) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    content: null,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback((position: { x: number; y: number }, content: React.ReactNode) => {
    // Adjust position to keep menu within viewport
    const menuWidth = 200;
    const menuHeight = 300;
    const padding = 8;

    let x = position.x;
    let y = position.y;

    if (typeof window !== 'undefined') {
      if (x + menuWidth > window.innerWidth - padding) {
        x = window.innerWidth - menuWidth - padding;
      }
      if (y + menuHeight > window.innerHeight - padding) {
        y = window.innerHeight - menuHeight - padding;
      }
    }

    setState({ isOpen: true, position: { x, y }, content });
  }, []);

  const closeMenu = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
      }
    }

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [state.isOpen, closeMenu]);

  return (
    <ContextMenuContext.Provider value={{ openMenu, closeMenu }}>
      {children}
      {state.isOpen && (
        <div
          ref={menuRef}
          className={clsx(
            'fixed z-50 min-w-48 rounded-lg shadow-xl border overflow-hidden',
            'animate-in fade-in zoom-in-95 duration-100',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}
          style={{
            left: state.position.x,
            top: state.position.y,
          }}
        >
          {state.content}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}

// Menu components
interface ContextMenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function ContextMenuItem({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  destructive,
}: ContextMenuItemProps) {
  const { theme } = useAppStore();
  const { closeMenu } = useContextMenu();

  const handleClick = () => {
    if (!disabled) {
      onClick();
      closeMenu();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : destructive
            ? theme === 'dark'
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-red-600 hover:bg-red-50'
            : theme === 'dark'
              ? 'text-gray-300 hover:bg-omnifocus-surface'
              : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      {icon && (
        <span className={clsx(
          'shrink-0',
          disabled
            ? 'opacity-50'
            : destructive
              ? 'text-red-500'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {icon}
        </span>
      )}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className={clsx(
          'text-xs shrink-0',
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        )}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

export function ContextMenuSeparator() {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'my-1 h-px',
      theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
    )} />
  );
}

interface ContextMenuLabelProps {
  children: React.ReactNode;
}

export function ContextMenuLabel({ children }: ContextMenuLabelProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
    )}>
      {children}
    </div>
  );
}

interface ContextMenuCheckboxProps {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ContextMenuCheckbox({
  icon,
  label,
  checked,
  onChange,
}: ContextMenuCheckboxProps) {
  const { theme } = useAppStore();

  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
        theme === 'dark'
          ? 'text-gray-300 hover:bg-omnifocus-surface'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      {icon && (
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          {icon}
        </span>
      )}
      <span className="flex-1">{label}</span>
      <span className={clsx(
        'w-4 h-4 rounded border flex items-center justify-center',
        checked
          ? 'bg-omnifocus-purple border-omnifocus-purple'
          : theme === 'dark'
            ? 'border-gray-600'
            : 'border-gray-300'
      )}>
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

// Submenu support
interface ContextMenuSubmenuProps {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

export function ContextMenuSubmenu({ icon, label, children }: ContextMenuSubmenuProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
          theme === 'dark'
            ? 'text-gray-300 hover:bg-omnifocus-surface'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        {icon && (
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            {icon}
          </span>
        )}
        <span className="flex-1">{label}</span>
        <svg
          className={clsx(
            'w-4 h-4',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute left-full top-0 ml-1 min-w-40 rounded-lg shadow-xl border overflow-hidden',
            'animate-in fade-in slide-in-from-left-2 duration-100',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Hook to trigger context menu on right-click
export function useContextMenuTrigger(content: () => React.ReactNode) {
  const { openMenu } = useContextMenu();

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    openMenu({ x: e.clientX, y: e.clientY }, content());
  }, [openMenu, content]);

  return { onContextMenu };
}

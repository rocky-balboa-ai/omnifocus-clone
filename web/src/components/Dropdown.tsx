'use client';

import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

// Context for dropdown state
interface DropdownContextType {
  isOpen: boolean;
  close: () => void;
  theme: 'light' | 'dark';
}

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown');
  }
  return context;
}

// Main dropdown container
interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, close: () => setIsOpen(false), theme }}>
      <div ref={containerRef} className={clsx('relative', className)}>
        {typeof children === 'function'
          ? (children as (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode)({
              isOpen,
              toggle: () => setIsOpen(!isOpen),
            })
          : children}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown trigger
interface DropdownTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownTrigger({ children, onClick, className }: DropdownTriggerProps) {
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}

// Dropdown menu
interface DropdownMenuProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: 'auto' | 'full' | number;
  className?: string;
}

export function DropdownMenu({
  children,
  align = 'left',
  width = 'auto',
  className,
}: DropdownMenuProps) {
  const { isOpen, theme } = useDropdownContext();

  if (!isOpen) return null;

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={clsx(
        'absolute top-full mt-1 z-50 rounded-xl shadow-xl border overflow-hidden',
        'animate-in fade-in slide-in-from-top-2 duration-150',
        alignClasses[align],
        width === 'full' ? 'w-full' : width === 'auto' ? 'min-w-[180px]' : undefined,
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200',
        className
      )}
      style={typeof width === 'number' ? { width } : undefined}
    >
      {children}
    </div>
  );
}

// Dropdown section (for grouping items)
interface DropdownSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function DropdownSection({ children, title, className }: DropdownSectionProps) {
  const { theme } = useDropdownContext();

  return (
    <div className={clsx('py-1', className)}>
      {title && (
        <div className={clsx(
          'px-3 py-1.5 text-xs font-medium uppercase',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// Dropdown item
interface DropdownItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcut?: string;
  selected?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({
  children,
  icon,
  rightIcon,
  shortcut,
  selected,
  disabled,
  danger,
  onClick,
  className,
}: DropdownItemProps) {
  const { close, theme } = useDropdownContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    close();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : danger
            ? 'text-red-500 hover:bg-red-500/10'
            : selected
              ? theme === 'dark'
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : 'bg-omnifocus-purple/10 text-omnifocus-purple'
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-700 hover:bg-gray-100',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {selected && <Check size={14} className="shrink-0" />}
      {rightIcon && !selected && <span className="shrink-0">{rightIcon}</span>}
      {shortcut && (
        <span className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

// Dropdown divider
export function DropdownDivider({ className }: { className?: string }) {
  const { theme } = useDropdownContext();

  return (
    <div className={clsx(
      'my-1 border-t',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200',
      className
    )} />
  );
}

// Dropdown checkbox item
interface DropdownCheckboxProps {
  children: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownCheckbox({
  children,
  checked,
  onChange,
  disabled,
  className,
}: DropdownCheckboxProps) {
  const { theme } = useDropdownContext();

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : theme === 'dark'
            ? 'text-gray-300 hover:bg-omnifocus-surface'
            : 'text-gray-700 hover:bg-gray-100',
        className
      )}
    >
      <span className={clsx(
        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
        checked
          ? 'bg-omnifocus-purple border-omnifocus-purple'
          : theme === 'dark'
            ? 'border-gray-600'
            : 'border-gray-300'
      )}>
        {checked && (
          <Check size={10} className="text-white" />
        )}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

// Select dropdown (pre-built dropdown for selection)
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectDropdownProps {
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled,
  className,
}: SelectDropdownProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-white hover:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={clsx(
          'flex items-center gap-2 truncate',
          !selectedOption && (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
        )}>
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className={clsx(
          'shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 right-0 mt-1 z-50 rounded-xl shadow-xl border overflow-hidden',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          'max-h-60 overflow-y-auto',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  option.value === value
                    ? theme === 'dark'
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {option.value === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

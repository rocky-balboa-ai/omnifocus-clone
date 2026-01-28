'use client';

import { forwardRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  label?: string;
  description?: string;
  className?: string;
}

const sizeClasses: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
}, ref) => {
  const { theme } = useAppStore();
  const sizeConfig = sizeClasses[size];

  const switchElement = (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme === 'dark' ? 'focus:ring-offset-omnifocus-sidebar' : 'focus:ring-offset-white',
        sizeConfig.track,
        checked
          ? 'bg-omnifocus-purple focus:ring-omnifocus-purple/50'
          : theme === 'dark'
            ? 'bg-omnifocus-surface focus:ring-omnifocus-purple/30'
            : 'bg-gray-200 focus:ring-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out',
          sizeConfig.thumb,
          checked ? sizeConfig.translate : 'translate-x-0.5',
          'mt-0.5 ml-0.5'
        )}
      />
    </button>
  );

  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <label className={clsx(
      'flex items-start gap-3 cursor-pointer',
      disabled && 'cursor-not-allowed',
      className
    )}>
      {switchElement}
      <div className="flex-1">
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {label}
        </span>
        {description && (
          <p className={clsx(
            'text-xs mt-0.5',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {description}
          </p>
        )}
      </div>
    </label>
  );
});

Switch.displayName = 'Switch';

// Switch group for multiple switches
interface SwitchGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function SwitchGroup({ children, label, className }: SwitchGroupProps) {
  const { theme } = useAppStore();

  return (
    <div className={className}>
      {label && (
        <p className={clsx(
          'text-sm font-medium mb-3',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {label}
        </p>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

// iOS-style switch with icon
interface IconSwitchProps extends Omit<SwitchProps, 'label' | 'description'> {
  onIcon?: React.ReactNode;
  offIcon?: React.ReactNode;
}

export const IconSwitch = forwardRef<HTMLButtonElement, IconSwitchProps>(({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  onIcon,
  offIcon,
  className,
}, ref) => {
  const { theme } = useAppStore();

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative inline-flex items-center justify-center w-14 h-7 rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme === 'dark' ? 'focus:ring-offset-omnifocus-sidebar' : 'focus:ring-offset-white',
        checked
          ? 'bg-omnifocus-purple focus:ring-omnifocus-purple/50'
          : theme === 'dark'
            ? 'bg-omnifocus-surface focus:ring-omnifocus-purple/30'
            : 'bg-gray-200 focus:ring-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Icons */}
      <span className={clsx(
        'absolute left-1.5 transition-opacity duration-200',
        checked ? 'opacity-100' : 'opacity-0',
        'text-white'
      )}>
        {onIcon}
      </span>
      <span className={clsx(
        'absolute right-1.5 transition-opacity duration-200',
        checked ? 'opacity-0' : 'opacity-100',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {offIcon}
      </span>

      {/* Thumb */}
      <span
        className={clsx(
          'absolute w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200',
          checked ? 'translate-x-3.5' : '-translate-x-3.5'
        )}
      />
    </button>
  );
});

IconSwitch.displayName = 'IconSwitch';

// Toggle button (looks like a button but toggles)
interface ToggleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ToggleButton({
  pressed,
  onPressedChange,
  children,
  disabled,
  className,
}: ToggleButtonProps) {
  const { theme } = useAppStore();

  return (
    <button
      type="button"
      role="switch"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => !disabled && onPressedChange(!pressed)}
      className={clsx(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        pressed
          ? 'bg-omnifocus-purple text-white'
          : theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-300 hover:text-white'
            : 'bg-gray-100 text-gray-700 hover:text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

// Toggle button group (only one can be active)
interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function ToggleGroup({ value, onValueChange, options, className }: ToggleGroupProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'inline-flex rounded-lg p-1',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === option.value
              ? theme === 'dark'
                ? 'bg-omnifocus-bg text-white shadow'
                : 'bg-white text-gray-900 shadow'
              : theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-500 hover:text-gray-900'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

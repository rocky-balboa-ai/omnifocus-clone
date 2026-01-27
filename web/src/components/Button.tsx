'use client';

import { forwardRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}, ref) => {
  const { theme } = useAppStore();

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 focus:ring-omnifocus-purple/50',
    secondary: theme === 'dark'
      ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-bg focus:ring-omnifocus-purple/30'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-200',
    ghost: theme === 'dark'
      ? 'text-gray-300 hover:text-white hover:bg-omnifocus-surface focus:ring-omnifocus-purple/30'
      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500/50',
    outline: theme === 'dark'
      ? 'border border-omnifocus-border text-gray-300 hover:text-white hover:border-gray-500 focus:ring-omnifocus-purple/30'
      : 'border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 focus:ring-gray-200',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme === 'dark' ? 'focus:ring-offset-omnifocus-sidebar' : 'focus:ring-offset-white',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={iconSizes[size]} className="animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Icon button (square button with just an icon)
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}, ref) => {
  const { theme } = useAppStore();

  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90',
    secondary: theme === 'dark'
      ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-bg'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: theme === 'dark'
      ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
    danger: 'text-red-500 hover:bg-red-500/10',
    success: 'text-green-500 hover:bg-green-500/10',
    outline: theme === 'dark'
      ? 'border border-omnifocus-border text-gray-400 hover:text-white'
      : 'border border-gray-300 text-gray-500 hover:text-gray-900',
  };

  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg transition-colors',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
});

IconButton.displayName = 'IconButton';

// Button group
interface ButtonGroupProps {
  children: React.ReactNode;
  attached?: boolean;
  className?: string;
}

export function ButtonGroup({ children, attached = true, className }: ButtonGroupProps) {
  return (
    <div className={clsx(
      'inline-flex',
      attached
        ? '[&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:not(:last-child)]:border-r-0'
        : 'gap-2',
      className
    )}>
      {children}
    </div>
  );
}

// Split button (button with dropdown)
interface SplitButtonProps extends ButtonProps {
  menuItems: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
}

export function SplitButton({
  menuItems,
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  ...props
}: SplitButtonProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <ButtonGroup attached>
        <Button variant={variant} size={size} onClick={onClick} {...props}>
          {children}
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsOpen(!isOpen)}
          className="px-2"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5l3 3 3-3" />
          </svg>
        </Button>
      </ButtonGroup>

      {isOpen && (
        <div className={clsx(
          'absolute top-full right-0 mt-1 min-w-[160px] rounded-lg shadow-xl border overflow-hidden z-50',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-omnifocus-surface'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Need to import useState for SplitButton
import { useState } from 'react';

// Link styled as button
interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}, ref) => {
  const { theme } = useAppStore();

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90',
    secondary: theme === 'dark'
      ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-bg'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: theme === 'dark'
      ? 'text-gray-300 hover:text-white hover:bg-omnifocus-surface'
      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    outline: theme === 'dark'
      ? 'border border-omnifocus-border text-gray-300 hover:text-white'
      : 'border border-gray-300 text-gray-700 hover:text-gray-900',
  };

  return (
    <a
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  );
});

LinkButton.displayName = 'LinkButton';

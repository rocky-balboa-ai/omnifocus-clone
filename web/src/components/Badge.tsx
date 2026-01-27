'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className,
}: BadgeProps) {
  const { theme } = useAppStore();

  const variantClasses: Record<BadgeVariant, string> = {
    default: theme === 'dark'
      ? 'bg-omnifocus-surface text-gray-300 border-omnifocus-border'
      : 'bg-gray-100 text-gray-700 border-gray-200',
    primary: theme === 'dark'
      ? 'bg-omnifocus-purple/20 text-omnifocus-purple border-omnifocus-purple/30'
      : 'bg-omnifocus-purple/10 text-omnifocus-purple border-omnifocus-purple/20',
    success: theme === 'dark'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-green-100 text-green-700 border-green-200',
    warning: theme === 'dark'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: theme === 'dark'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-red-100 text-red-700 border-red-200',
    info: theme === 'dark'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500',
    primary: 'bg-omnifocus-purple',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant]
        )} />
      )}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l6 6M8 2L2 8" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Count badge (for notifications, etc.)
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'primary',
  size = 'sm',
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant={variant} size={size} className={className}>
      {displayCount}
    </Badge>
  );
}

// Status badge with dot
interface StatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'paused' | 'error';
  label?: string;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'info', label: 'Completed' },
    paused: { variant: 'default', label: 'Paused' },
    error: { variant: 'error', label: 'Error' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {label || config.label}
    </Badge>
  );
}

// Badge group
interface BadgeGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export function BadgeGroup({ children, max, className }: BadgeGroupProps) {
  const { theme } = useAppStore();
  const childArray = Array.isArray(children) ? children : [children];
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const hiddenCount = max ? Math.max(0, childArray.length - max) : 0;

  return (
    <div className={clsx('flex flex-wrap items-center gap-1', className)}>
      {visibleChildren}
      {hiddenCount > 0 && (
        <span className={clsx(
          'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
          theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-400'
            : 'bg-gray-100 text-gray-500'
        )}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

// Outlined badge
interface OutlinedBadgeProps {
  children: React.ReactNode;
  color?: string;
  size?: BadgeSize;
  className?: string;
}

export function OutlinedBadge({
  children,
  color = '#8B5CF6',
  size = 'md',
  className,
}: OutlinedBadgeProps) {
  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}10`,
      }}
    >
      {children}
    </span>
  );
}

// Icon badge (badge with just an icon)
interface IconBadgeProps {
  icon: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function IconBadge({ icon, variant = 'default', size = 'md', className }: IconBadgeProps) {
  const { theme } = useAppStore();

  const variantClasses: Record<BadgeVariant, string> = {
    default: theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
    primary: theme === 'dark' ? 'bg-omnifocus-purple/20' : 'bg-omnifocus-purple/10',
    success: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100',
    warning: theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100',
    error: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100',
    info: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <span className={clsx(
      'inline-flex items-center justify-center rounded-full',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {icon}
    </span>
  );
}

// Badge input (badge that acts as input)
interface BadgeInputProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  placeholder?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function BadgeInput({
  value,
  onChange,
  onRemove,
  placeholder = 'Type...',
  variant = 'default',
  className,
}: BadgeInputProps) {
  const { theme } = useAppStore();

  const variantClasses: Record<BadgeVariant, string> = {
    default: theme === 'dark'
      ? 'bg-omnifocus-surface border-omnifocus-border'
      : 'bg-gray-100 border-gray-200',
    primary: theme === 'dark'
      ? 'bg-omnifocus-purple/20 border-omnifocus-purple/30'
      : 'bg-omnifocus-purple/10 border-omnifocus-purple/20',
    success: theme === 'dark'
      ? 'bg-green-500/20 border-green-500/30'
      : 'bg-green-100 border-green-200',
    warning: theme === 'dark'
      ? 'bg-yellow-500/20 border-yellow-500/30'
      : 'bg-yellow-100 border-yellow-200',
    error: theme === 'dark'
      ? 'bg-red-500/20 border-red-500/30'
      : 'bg-red-100 border-red-200',
    info: theme === 'dark'
      ? 'bg-blue-500/20 border-blue-500/30'
      : 'bg-blue-100 border-blue-200',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
      variantClasses[variant],
      className
    )}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'bg-transparent outline-none text-xs w-16',
          theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
        )}
      />
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l6 6M8 2L2 8" />
        </svg>
      </button>
    </span>
  );
}

// Notification dot
interface NotificationDotProps {
  show?: boolean;
  color?: string;
  className?: string;
}

export function NotificationDot({ show = true, color, className }: NotificationDotProps) {
  if (!show) return null;

  return (
    <span
      className={clsx(
        'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
        !color && 'bg-red-500',
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

// Badge with icon
interface BadgeWithIconProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function BadgeWithIcon({
  icon,
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeWithIconProps) {
  return (
    <Badge variant={variant} size={size} className={className}>
      {icon}
      {children}
    </Badge>
  );
}

'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelPosition?: 'start' | 'center' | 'end';
  thickness?: 'thin' | 'normal' | 'thick';
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  thickness = 'normal',
  className,
}: DividerProps) {
  const { theme } = useAppStore();

  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const thicknessClasses = {
    thin: 'border-[0.5px]',
    normal: 'border',
    thick: 'border-2',
  };

  const borderColor = theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200';

  if (orientation === 'vertical') {
    return (
      <div
        className={clsx(
          'h-full w-0',
          variantClasses[variant],
          thicknessClasses[thickness],
          borderColor,
          className
        )}
      />
    );
  }

  // Horizontal with optional label
  if (label) {
    return (
      <div className={clsx('flex items-center', className)}>
        {labelPosition !== 'start' && (
          <div className={clsx(
            'flex-1',
            variantClasses[variant],
            thicknessClasses[thickness],
            borderColor,
            'border-t'
          )} />
        )}
        <span className={clsx(
          'px-3 text-xs font-medium uppercase tracking-wider',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {label}
        </span>
        {labelPosition !== 'end' && (
          <div className={clsx(
            'flex-1',
            variantClasses[variant],
            thicknessClasses[thickness],
            borderColor,
            'border-t'
          )} />
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'w-full h-0',
        variantClasses[variant],
        thicknessClasses[thickness],
        borderColor,
        'border-t',
        className
      )}
    />
  );
}

// Section divider with icon
interface SectionDividerProps {
  icon?: React.ReactNode;
  label: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionDivider({ icon, label, action, className }: SectionDividerProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center gap-2 py-3',
      className
    )}>
      <div className={clsx(
        'flex items-center gap-2',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={clsx(
        'flex-1 h-px',
        theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
      )} />
      {action}
    </div>
  );
}

// Spacer (invisible divider for spacing)
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spacer({ size = 'md', className }: SpacerProps) {
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  };

  return <div className={clsx(sizeClasses[size], className)} />;
}

// Visual separator for lists
interface ListSeparatorProps {
  inset?: boolean;
  className?: string;
}

export function ListSeparator({ inset = false, className }: ListSeparatorProps) {
  const { theme } = useAppStore();

  return (
    <div
      className={clsx(
        'h-px',
        inset ? 'ml-12' : '',
        theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-100',
        className
      )}
    />
  );
}

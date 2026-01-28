'use client';

import { forwardRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

// Basic card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className,
  children,
  ...props
}, ref) => {
  const { theme } = useAppStore();

  const variantClasses = {
    default: clsx(
      'rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    ),
    elevated: clsx(
      'rounded-xl shadow-lg',
      theme === 'dark'
        ? 'bg-omnifocus-surface'
        : 'bg-white'
    ),
    outlined: clsx(
      'rounded-xl border-2',
      theme === 'dark'
        ? 'border-omnifocus-border'
        : 'border-gray-200'
    ),
    ghost: clsx(
      'rounded-xl',
      theme === 'dark'
        ? 'bg-omnifocus-surface/50'
        : 'bg-gray-50'
    ),
  };

  const interactiveClasses = clsx(
    hoverable && 'transition-all duration-200',
    hoverable && (theme === 'dark'
      ? 'hover:border-gray-600 hover:shadow-lg'
      : 'hover:border-gray-300 hover:shadow-md'),
    clickable && 'cursor-pointer'
  );

  return (
    <div
      ref={ref}
      className={clsx(
        variantClasses[variant],
        paddingClasses[padding],
        interactiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card header
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: CardHeaderProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className={clsx(
            'p-2 rounded-lg shrink-0',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
          )}>
            {icon}
          </div>
        )}
        <div>
          <h3 className={clsx(
            'font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </h3>
          {subtitle && (
            <p className={clsx(
              'text-sm mt-0.5',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// Card content
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('mt-4', className)}>
      {children}
    </div>
  );
}

// Card footer
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'mt-4 pt-4 border-t flex items-center justify-end gap-2',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200',
      className
    )}>
      {children}
    </div>
  );
}

// Stat card
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  className,
}: StatCardProps) {
  const { theme } = useAppStore();

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
  };

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className={clsx(
            'text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {title}
          </p>
          <p className={clsx(
            'text-2xl font-bold mt-1',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {value}
          </p>
          {change && (
            <p className={clsx('text-sm mt-1', trendColors[change.trend])}>
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'}
              {' '}
              {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx(
            'p-3 rounded-xl',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Feature card
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  action,
  className,
}: FeatureCardProps) {
  const { theme } = useAppStore();

  return (
    <Card hoverable className={className}>
      <div className={clsx(
        'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
        'bg-omnifocus-purple/10 text-omnifocus-purple'
      )}>
        {icon}
      </div>
      <h3 className={clsx(
        'font-semibold mb-2',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {title}
      </h3>
      <p className={clsx(
        'text-sm',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-omnifocus-purple hover:underline"
        >
          {action.label} →
        </button>
      )}
    </Card>
  );
}

// Image card
interface ImageCardProps {
  image: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ImageCard({
  image,
  title,
  description,
  badge,
  onClick,
  className,
}: ImageCardProps) {
  const { theme } = useAppStore();

  return (
    <Card
      padding="none"
      hoverable
      clickable={!!onClick}
      onClick={onClick}
      className={clsx('overflow-hidden', className)}
    >
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-40 object-cover"
        />
        {badge && (
          <div className="absolute top-2 right-2">
            {badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className={clsx(
          'font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </h3>
        {description && (
          <p className={clsx(
            'text-sm mt-1',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}

// Card grid
interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className,
}: CardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={clsx(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// List card (card with list items)
interface ListCardProps {
  title?: string;
  items: Array<{
    id: string;
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    rightContent?: React.ReactNode;
    onClick?: () => void;
  }>;
  emptyMessage?: string;
  className?: string;
}

export function ListCard({
  title,
  items,
  emptyMessage = 'No items',
  className,
}: ListCardProps) {
  const { theme } = useAppStore();

  return (
    <Card padding="none" className={className}>
      {title && (
        <div className={clsx(
          'px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <h3 className={clsx(
            'font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </h3>
        </div>
      )}
      {items.length === 0 ? (
        <p className={clsx(
          'px-4 py-6 text-center text-sm',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {emptyMessage}
        </p>
      ) : (
        <div className="divide-y divide-omnifocus-border">
          {items.map(item => (
            <div
              key={item.id}
              onClick={item.onClick}
              className={clsx(
                'flex items-center gap-3 px-4 py-3',
                item.onClick && 'cursor-pointer transition-colors',
                item.onClick && (theme === 'dark'
                  ? 'hover:bg-omnifocus-bg/50'
                  : 'hover:bg-gray-50')
              )}
            >
              {item.icon && (
                <div className={clsx(
                  'shrink-0',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-sm font-medium truncate',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className={clsx(
                    'text-xs truncate',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    {item.subtitle}
                  </p>
                )}
              </div>
              {item.rightContent}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={clsx(
        'rounded-full border-omnifocus-purple/30 border-t-omnifocus-purple animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ message, fullScreen = false }: LoadingOverlayProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center',
      fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0',
      theme === 'dark' ? 'bg-omnifocus-bg/80' : 'bg-white/80',
      'backdrop-blur-sm'
    )}>
      <LoadingSpinner size="lg" />
      {message && (
        <p className={clsx(
          'mt-4 text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {message}
        </p>
      )}
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="w-2 h-2 rounded-full bg-omnifocus-purple animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-omnifocus-purple animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-omnifocus-purple animate-bounce" />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const { theme } = useAppStore();

  const baseClasses = clsx(
    'animate-pulse',
    theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200',
    variant === 'circular' && 'rounded-full',
    variant === 'rectangular' && 'rounded-lg',
    variant === 'text' && 'rounded h-4',
    className
  );

  return (
    <div
      className={baseClasses}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Skeleton for action items
export function ActionSkeleton() {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-surface/50' : 'bg-gray-50'
    )}>
      <Skeleton variant="circular" width={20} height={20} />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" />
        <Skeleton width="40%" className="h-3" />
      </div>
    </div>
  );
}

// Skeleton for project cards
export function ProjectSkeleton() {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton width="60%" />
      </div>
      <Skeleton width="100%" className="h-2 mb-3" />
      <div className="flex gap-2">
        <Skeleton width={60} className="h-6" />
        <Skeleton width={80} className="h-6" />
      </div>
    </div>
  );
}

// Loading state for lists
interface LoadingListProps {
  count?: number;
  type?: 'action' | 'project';
}

export function LoadingList({ count = 5, type = 'action' }: LoadingListProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        type === 'action' ? <ActionSkeleton key={i} /> : <ProjectSkeleton key={i} />
      ))}
    </div>
  );
}

// Full page loading
export function PageLoading() {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'h-full flex flex-col items-center justify-center',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white'
    )}>
      <LoadingSpinner size="lg" />
      <p className={clsx(
        'mt-4 text-sm',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        Loading...
      </p>
    </div>
  );
}

// Inline loading indicator
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  const { theme } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span className={clsx(
        'text-sm',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {text}
      </span>
    </div>
  );
}

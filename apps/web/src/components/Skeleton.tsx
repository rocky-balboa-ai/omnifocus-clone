'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  animate?: boolean;
}

export function SkeletonBox({
  width,
  height,
  rounded = 'md',
  className,
  animate = true,
}: SkeletonBoxProps) {
  const { theme } = useAppStore();

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={clsx(
        roundedClasses[rounded],
        animate && 'animate-pulse',
        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Text skeleton (single line)
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  className?: string;
}

export function SkeletonText({
  lines = 1,
  lineHeight = 16,
  gap = 8,
  className,
}: SkeletonTextProps) {
  const widths = ['100%', '90%', '95%', '85%', '75%'];

  return (
    <div className={clsx('space-y-2', className)} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={widths[i % widths.length]}
          height={lineHeight}
          rounded="sm"
        />
      ))}
    </div>
  );
}

// Circle skeleton (for avatars)
export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  );
}

// Action item skeleton
export function SkeletonActionItem({ className }: { className?: string }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-white',
      className
    )}>
      <SkeletonCircle size={20} />
      <div className="flex-1 space-y-2">
        <SkeletonBox width="60%" height={14} />
        <SkeletonBox width="30%" height={10} />
      </div>
    </div>
  );
}

// Action list skeleton
export function SkeletonActionList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonActionItem key={i} />
      ))}
    </div>
  );
}

// Project card skeleton
export function SkeletonProjectCard({ className }: { className?: string }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200',
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <SkeletonBox width={24} height={24} rounded="lg" />
        <SkeletonBox width="50%" height={18} />
      </div>
      <SkeletonBox width="80%" height={12} className="mb-2" />
      <div className="flex items-center justify-between mt-4">
        <SkeletonBox width={60} height={20} rounded="full" />
        <SkeletonBox width={40} height={14} />
      </div>
    </div>
  );
}

// Stat card skeleton
export function SkeletonStatCard({ className }: { className?: string }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <SkeletonBox width={20} height={20} rounded="md" />
        <SkeletonBox width="40%" height={12} />
      </div>
      <SkeletonBox width="60%" height={32} className="mb-1" />
      <SkeletonBox width="30%" height={10} />
    </div>
  );
}

// Calendar skeleton
export function SkeletonCalendar({ className }: { className?: string }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox width={100} height={18} />
        <div className="flex gap-2">
          <SkeletonBox width={24} height={24} rounded="md" />
          <SkeletonBox width={24} height={24} rounded="md" />
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBox key={i} width="100%" height={12} className="mx-auto" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={32}
            height={32}
            rounded="md"
            className="mx-auto"
          />
        ))}
      </div>
    </div>
  );
}

// Dashboard skeleton
export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SkeletonActionList count={6} />
        </div>
        <div>
          <SkeletonCalendar />
        </div>
      </div>
    </div>
  );
}

// Sidebar skeleton
export function SkeletonSidebar({ className }: { className?: string }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'w-64 p-4 space-y-6',
      theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-gray-50',
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <SkeletonBox width={32} height={32} rounded="lg" />
        <SkeletonBox width={80} height={18} />
      </div>

      {/* Search */}
      <SkeletonBox width="100%" height={36} rounded="lg" />

      {/* Nav items */}
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <SkeletonBox width={18} height={18} rounded="md" />
            <SkeletonBox width={`${60 + Math.random() * 30}%`} height={14} />
          </div>
        ))}
      </div>

      {/* Projects section */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <SkeletonBox width={60} height={12} />
          <SkeletonBox width={16} height={16} rounded="md" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <SkeletonBox width={14} height={14} rounded="sm" />
              <SkeletonBox width={`${50 + Math.random() * 40}%`} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Full page skeleton
export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={clsx('flex h-screen', className)}>
      <SkeletonSidebar />
      <div className="flex-1 p-6">
        <SkeletonDashboard />
      </div>
    </div>
  );
}

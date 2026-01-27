'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showPercentage?: boolean;
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  className?: string;
  children?: React.ReactNode;
}

const SIZE_CONFIG = {
  sm: { dimension: 32, defaultStroke: 3, fontSize: 'text-xs' },
  md: { dimension: 48, defaultStroke: 4, fontSize: 'text-sm' },
  lg: { dimension: 64, defaultStroke: 5, fontSize: 'text-base' },
  xl: { dimension: 96, defaultStroke: 6, fontSize: 'text-lg' },
};

const COLOR_CONFIG = {
  purple: { stroke: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' },
  green: { stroke: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
  blue: { stroke: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' },
  orange: { stroke: '#F97316', bg: 'rgba(249, 115, 22, 0.2)' },
  red: { stroke: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' },
};

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth,
  showPercentage = true,
  color = 'purple',
  className,
  children,
}: ProgressRingProps) {
  const { theme } = useAppStore();
  const config = SIZE_CONFIG[size];
  const colorConfig = COLOR_CONFIG[color];
  const stroke = strokeWidth || config.defaultStroke;

  const dimension = config.dimension;
  const radius = (dimension - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth={stroke}
        />

        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className={clsx(
            'font-semibold',
            config.fontSize,
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {Math.round(clampedProgress)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Mini progress ring for inline use
interface MiniProgressRingProps {
  progress: number;
  size?: number;
  color?: string;
  className?: string;
}

export function MiniProgressRing({
  progress,
  size = 20,
  color = '#8B5CF6',
  className,
}: MiniProgressRingProps) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} className={clsx('transform -rotate-90', className)}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  );
}

// Progress ring with label
interface LabeledProgressRingProps extends ProgressRingProps {
  label: string;
  sublabel?: string;
}

export function LabeledProgressRing({
  label,
  sublabel,
  ...props
}: LabeledProgressRingProps) {
  const { theme } = useAppStore();

  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing {...props} />
      <div className="text-center">
        <p className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {label}
        </p>
        {sublabel && (
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// Completion ring (binary complete/incomplete)
interface CompletionRingProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function CompletionRing({
  completed,
  total,
  size = 'md',
  showCount = true,
  className,
}: CompletionRingProps) {
  const { theme } = useAppStore();
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const config = SIZE_CONFIG[size];

  return (
    <ProgressRing
      progress={progress}
      size={size}
      color={progress === 100 ? 'green' : 'purple'}
      showPercentage={false}
      className={className}
    >
      {showCount && (
        <div className="text-center">
          <span className={clsx(
            'font-bold',
            config.fontSize,
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {completed}
          </span>
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            /{total}
          </span>
        </div>
      )}
    </ProgressRing>
  );
}

// Streak ring with flame icon
interface StreakRingProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakRing({ streak, size = 'md', className }: StreakRingProps) {
  const { theme } = useAppStore();
  const config = SIZE_CONFIG[size];
  // Progress based on streak (caps at 30 days for full ring)
  const progress = Math.min(100, (streak / 30) * 100);

  return (
    <ProgressRing
      progress={progress}
      size={size}
      color="orange"
      showPercentage={false}
      className={className}
    >
      <div className="text-center">
        <span className={clsx(
          'font-bold',
          config.fontSize,
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {streak}
        </span>
        {size !== 'sm' && (
          <span className="block text-xs text-omnifocus-orange">days</span>
        )}
      </div>
    </ProgressRing>
  );
}

// Multiple progress rings in a row
interface ProgressRingGroupProps {
  items: {
    label: string;
    progress: number;
    color?: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  }[];
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressRingGroup({ items, size = 'sm', className }: ProgressRingGroupProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <ProgressRing
            progress={item.progress}
            size={size}
            color={item.color || 'purple'}
            showPercentage={true}
          />
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

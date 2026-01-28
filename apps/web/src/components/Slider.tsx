'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'orange';
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
  disabled = false,
  size = 'md',
  color = 'purple',
  className,
}: SliderProps) {
  const { theme } = useAppStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sizeConfig = {
    sm: { track: 'h-1', thumb: 'w-3 h-3', label: 'text-xs' },
    md: { track: 'h-2', thumb: 'w-4 h-4', label: 'text-sm' },
    lg: { track: 'h-3', thumb: 'w-5 h-5', label: 'text-base' },
  };

  const colorConfig = {
    purple: 'bg-omnifocus-purple',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-omnifocus-orange',
  };

  const config = sizeConfig[size];
  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const rawValue = (x / rect.width) * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onChange(clampedValue);
  }, [min, max, step, disabled, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValue]);

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, value - step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }

    e.preventDefault();
    onChange(newValue);
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className={clsx(
              config.label,
              'font-medium',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={clsx(
              config.label,
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {formatValue(value)}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className={clsx(
          'relative rounded-full cursor-pointer select-none',
          config.track,
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Fill */}
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-all',
            colorConfig[color]
          )}
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow-md transition-shadow',
            config.thumb,
            colorConfig[color],
            'border-2 border-white',
            isDragging && 'scale-110 shadow-lg',
            !disabled && 'hover:scale-110 hover:shadow-lg'
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Range slider (two handles)
interface RangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValue = (v) => v.toString(),
  disabled = false,
  className,
}: RangeSliderProps) {
  const { theme } = useAppStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  const startPercentage = ((value[0] - min) / (max - min)) * 100;
  const endPercentage = ((value[1] - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number, handle: 'start' | 'end') => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const rawValue = (x / rect.width) * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    if (handle === 'start') {
      onChange([Math.min(clampedValue, value[1] - step), value[1]]);
    } else {
      onChange([value[0], Math.max(clampedValue, value[0] + step)]);
    }
  }, [min, max, step, value, disabled, onChange]);

  useEffect(() => {
    if (!draggingHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX, draggingHandle);
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, updateValue]);

  return (
    <div className={clsx('w-full', className)}>
      {/* Label and value */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {label}
          </span>
        )}
        <span className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {formatValue(value[0])} - {formatValue(value[1])}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className={clsx(
          'relative h-2 rounded-full cursor-pointer',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 bg-omnifocus-purple rounded-full"
          style={{
            left: `${startPercentage}%`,
            width: `${endPercentage - startPercentage}%`,
          }}
        />

        {/* Start handle */}
        <div
          onMouseDown={() => !disabled && setDraggingHandle('start')}
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full',
            'bg-omnifocus-purple border-2 border-white shadow-md',
            'cursor-grab active:cursor-grabbing',
            draggingHandle === 'start' && 'scale-110 shadow-lg'
          )}
          style={{ left: `${startPercentage}%` }}
        />

        {/* End handle */}
        <div
          onMouseDown={() => !disabled && setDraggingHandle('end')}
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full',
            'bg-omnifocus-purple border-2 border-white shadow-md',
            'cursor-grab active:cursor-grabbing',
            draggingHandle === 'end' && 'scale-110 shadow-lg'
          )}
          style={{ left: `${endPercentage}%` }}
        />
      </div>
    </div>
  );
}

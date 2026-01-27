'use client';

import { forwardRef, useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Eye, EyeOff, X, AlertCircle, Check } from 'lucide-react';
import clsx from 'clsx';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  clearable?: boolean;
  onClear?: () => void;
}

const sizeClasses: Record<InputSize, { input: string; icon: string }> = {
  sm: { input: 'px-3 py-1.5 text-sm', icon: 'px-2' },
  md: { input: 'px-3 py-2 text-sm', icon: 'px-3' },
  lg: { input: 'px-4 py-3 text-base', icon: 'px-4' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  size = 'md',
  clearable = false,
  onClear,
  className,
  disabled,
  value,
  ...props
}, ref) => {
  const { theme } = useAppStore();
  const sizeConfig = sizeClasses[size];

  const hasValue = value !== undefined && value !== '';
  const showClear = clearable && hasValue && !disabled;

  return (
    <div className={className}>
      {label && (
        <label className={clsx(
          'block text-sm font-medium mb-1.5',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className={clsx(
            'absolute left-0 top-0 bottom-0 flex items-center',
            sizeConfig.icon,
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          value={value}
          disabled={disabled}
          className={clsx(
            'w-full rounded-lg border outline-none transition-colors',
            sizeConfig.input,
            leftIcon && 'pl-10',
            (rightIcon || showClear || error || success) && 'pr-10',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : success
                ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple focus:ring-2 focus:ring-omnifocus-purple/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple focus:ring-2 focus:ring-omnifocus-purple/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        />

        {(rightIcon || showClear || error || success) && (
          <div className={clsx(
            'absolute right-0 top-0 bottom-0 flex items-center',
            sizeConfig.icon
          )}>
            {error && <AlertCircle size={16} className="text-red-500" />}
            {success && !error && <Check size={16} className="text-green-500" />}
            {showClear && !error && !success && (
              <button
                type="button"
                onClick={onClear}
                className={clsx(
                  'p-0.5 rounded transition-colors',
                  theme === 'dark'
                    ? 'text-gray-500 hover:text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <X size={14} />
              </button>
            )}
            {rightIcon && !error && !success && !showClear && rightIcon}
          </div>
        )}
      </div>

      {(helperText || error || success) && (
        <p className={clsx(
          'mt-1.5 text-xs',
          error
            ? 'text-red-500'
            : success
              ? 'text-green-500'
              : theme === 'dark'
                ? 'text-gray-500'
                : 'text-gray-400'
        )}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Password input with toggle
interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const { theme } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={clsx(
            'p-0.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  size = 'md',
  resize = 'vertical',
  className,
  disabled,
  ...props
}, ref) => {
  const { theme } = useAppStore();
  const sizeConfig = sizeClasses[size];

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <div className={className}>
      {label && (
        <label className={clsx(
          'block text-sm font-medium mb-1.5',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        disabled={disabled}
        className={clsx(
          'w-full rounded-lg border outline-none transition-colors min-h-[80px]',
          sizeConfig.input,
          resizeClasses[resize],
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple focus:ring-2 focus:ring-omnifocus-purple/20'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple focus:ring-2 focus:ring-omnifocus-purple/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      />

      {(helperText || error) && (
        <p className={clsx(
          'mt-1.5 text-xs',
          error
            ? 'text-red-500'
            : theme === 'dark'
              ? 'text-gray-500'
              : 'text-gray-400'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Input with prefix/suffix
interface InputWithAffixProps extends Omit<InputProps, 'prefix'> {
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const InputWithAffix = forwardRef<HTMLInputElement, InputWithAffixProps>(({
  prefixElement,
  suffixElement,
  size = 'md',
  className,
  ...props
}, ref) => {
  const { theme } = useAppStore();
  const sizeConfig = sizeClasses[size];

  return (
    <div className={clsx('flex', className)}>
      {prefixElement && (
        <div className={clsx(
          'flex items-center rounded-l-lg border border-r-0',
          sizeConfig.input,
          theme === 'dark'
            ? 'bg-omnifocus-bg border-omnifocus-border text-gray-400'
            : 'bg-gray-50 border-gray-300 text-gray-500'
        )}>
          {prefixElement}
        </div>
      )}
      <Input
        ref={ref}
        size={size}
        className={clsx(
          'flex-1',
          prefixElement && '[&>div>input]:rounded-l-none',
          suffixElement && '[&>div>input]:rounded-r-none'
        )}
        {...props}
      />
      {suffixElement && (
        <div className={clsx(
          'flex items-center rounded-r-lg border border-l-0',
          sizeConfig.input,
          theme === 'dark'
            ? 'bg-omnifocus-bg border-omnifocus-border text-gray-400'
            : 'bg-gray-50 border-gray-300 text-gray-500'
        )}>
          {suffixElement}
        </div>
      )}
    </div>
  );
});

InputWithAffix.displayName = 'InputWithAffix';

// Number input with increment/decrement
interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  min,
  max,
  step = 1,
  value = 0,
  onChange,
  size = 'md',
  className,
  ...props
}, ref) => {
  const { theme } = useAppStore();

  const increment = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange?.(newValue);
    }
  };

  const decrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange?.(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      if (min !== undefined && newValue < min) return;
      if (max !== undefined && newValue > max) return;
      onChange?.(newValue);
    }
  };

  return (
    <div className={clsx('flex', className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={min !== undefined && value <= min}
        className={clsx(
          'px-3 rounded-l-lg border border-r-0 transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-gray-400 hover:text-white hover:bg-omnifocus-bg disabled:opacity-50'
            : 'bg-gray-50 border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50'
        )}
      >
        -
      </button>
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={clsx(
          'w-20 text-center border outline-none transition-colors',
          sizeClasses[size].input,
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-white focus:border-omnifocus-purple'
            : 'bg-white border-gray-300 text-gray-900 focus:border-omnifocus-purple',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
        {...props}
      />
      <button
        type="button"
        onClick={increment}
        disabled={max !== undefined && value >= max}
        className={clsx(
          'px-3 rounded-r-lg border border-l-0 transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-gray-400 hover:text-white hover:bg-omnifocus-bg disabled:opacity-50'
            : 'bg-gray-50 border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50'
        )}
      >
        +
      </button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

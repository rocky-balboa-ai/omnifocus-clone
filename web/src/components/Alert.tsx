'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import clsx from 'clsx';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig: Record<AlertVariant, {
  icon: typeof Info;
  iconColor: string;
  bgColor: { light: string; dark: string };
  borderColor: { light: string; dark: string };
}> = {
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    bgColor: { light: 'bg-blue-50', dark: 'bg-blue-500/10' },
    borderColor: { light: 'border-blue-200', dark: 'border-blue-500/30' },
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    bgColor: { light: 'bg-green-50', dark: 'bg-green-500/10' },
    borderColor: { light: 'border-green-200', dark: 'border-green-500/30' },
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    bgColor: { light: 'bg-yellow-50', dark: 'bg-yellow-500/10' },
    borderColor: { light: 'border-yellow-200', dark: 'border-yellow-500/30' },
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: { light: 'bg-red-50', dark: 'bg-red-500/10' },
    borderColor: { light: 'border-red-200', dark: 'border-red-500/30' },
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertProps) {
  const { theme } = useAppStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 p-4 rounded-xl border',
        theme === 'dark' ? config.bgColor.dark : config.bgColor.light,
        theme === 'dark' ? config.borderColor.dark : config.borderColor.light,
        className
      )}
    >
      <div className={clsx('shrink-0 mt-0.5', config.iconColor)}>
        {icon || <Icon size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={clsx(
            'font-semibold mb-1',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </h4>
        )}
        <div className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {children}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={clsx(
              'mt-2 text-sm font-medium',
              config.iconColor
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={clsx(
            'shrink-0 p-1 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Inline alert (smaller, for form validation etc.)
interface InlineAlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export function InlineAlert({ variant = 'error', children, className }: InlineAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'flex items-center gap-2 text-sm',
      config.iconColor,
      className
    )}>
      <Icon size={14} />
      <span>{children}</span>
    </div>
  );
}

// Banner alert (full width, usually at top of page)
interface BannerAlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function BannerAlert({
  variant = 'info',
  children,
  action,
  dismissible = true,
  onDismiss,
  className,
}: BannerAlertProps) {
  const { theme } = useAppStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-center justify-center gap-3 px-4 py-3',
        theme === 'dark' ? config.bgColor.dark : config.bgColor.light,
        className
      )}
    >
      <Icon size={18} className={config.iconColor} />
      <p className={clsx(
        'text-sm',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {children}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={clsx(
            'text-sm font-medium underline',
            config.iconColor
          )}
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={clsx(
            'ml-auto p-1 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Callout (highlighted info box)
interface CalloutProps {
  emoji?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({ emoji, title, children, className }: CalloutProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex gap-3 p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {emoji && (
        <span className="text-xl shrink-0">{emoji}</span>
      )}
      <div>
        {title && (
          <h4 className={clsx(
            'font-semibold mb-1',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </h4>
        )}
        <div className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Notice (simple notice with colored left border)
interface NoticeProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export function Notice({ variant = 'info', children, className }: NoticeProps) {
  const { theme } = useAppStore();
  const config = variantConfig[variant];

  const borderColors = {
    info: 'border-blue-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  return (
    <div className={clsx(
      'pl-4 border-l-4',
      borderColors[variant],
      className
    )}>
      <div className={clsx(
        'text-sm',
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        {children}
      </div>
    </div>
  );
}

// Tip component
interface TipProps {
  children: React.ReactNode;
  className?: string;
}

export function Tip({ children, className }: TipProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-start gap-2 p-3 rounded-lg text-sm',
      theme === 'dark'
        ? 'bg-omnifocus-purple/10 text-omnifocus-purple'
        : 'bg-omnifocus-purple/5 text-omnifocus-purple',
      className
    )}>
      <span className="text-base">💡</span>
      <div>{children}</div>
    </div>
  );
}

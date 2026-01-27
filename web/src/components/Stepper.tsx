'use client';

import { useAppStore } from '@/stores/app.store';
import { Check, Circle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Stepper({
  steps,
  orientation = 'horizontal',
  size = 'md',
  className,
}: StepperProps) {
  const { theme } = useAppStore();

  const sizeClasses = {
    sm: { icon: 24, text: 'text-xs', gap: 'gap-2' },
    md: { icon: 32, text: 'text-sm', gap: 'gap-3' },
    lg: { icon: 40, text: 'text-base', gap: 'gap-4' },
  };

  const config = sizeClasses[size];

  const renderStepIcon = (step: Step, index: number) => {
    const iconSize = config.icon * 0.5;

    const iconClasses = clsx(
      'flex items-center justify-center rounded-full shrink-0 transition-colors',
      step.status === 'completed' && 'bg-green-500 text-white',
      step.status === 'active' && 'bg-omnifocus-purple text-white',
      step.status === 'error' && 'bg-red-500 text-white',
      step.status === 'pending' && (
        theme === 'dark'
          ? 'bg-omnifocus-surface text-gray-400 border border-gray-600'
          : 'bg-gray-100 text-gray-400 border border-gray-300'
      )
    );

    return (
      <div
        className={iconClasses}
        style={{ width: config.icon, height: config.icon }}
      >
        {step.status === 'completed' ? (
          <Check size={iconSize} />
        ) : step.status === 'error' ? (
          <AlertCircle size={iconSize} />
        ) : (
          <span className={config.text}>{index + 1}</span>
        )}
      </div>
    );
  };

  const renderConnector = (index: number, prevStatus: StepStatus) => {
    if (index === 0) return null;

    const isCompleted = prevStatus === 'completed';

    if (orientation === 'horizontal') {
      return (
        <div className={clsx(
          'flex-1 h-0.5 mx-2',
          isCompleted
            ? 'bg-green-500'
            : theme === 'dark'
              ? 'bg-omnifocus-border'
              : 'bg-gray-200'
        )} />
      );
    }

    return (
      <div className={clsx(
        'w-0.5 h-8 mx-auto my-1',
        isCompleted
          ? 'bg-green-500'
          : theme === 'dark'
            ? 'bg-omnifocus-border'
            : 'bg-gray-200'
      )} />
    );
  };

  if (orientation === 'vertical') {
    return (
      <div className={clsx('flex flex-col', className)}>
        {steps.map((step, index) => (
          <div key={step.id}>
            {index > 0 && renderConnector(index, steps[index - 1].status)}
            <div className={clsx('flex items-start', config.gap)}>
              {renderStepIcon(step, index)}
              <div className="flex-1 min-w-0 pt-1">
                <p className={clsx(
                  config.text,
                  'font-medium',
                  step.status === 'completed' && (theme === 'dark' ? 'text-gray-400' : 'text-gray-500'),
                  step.status === 'active' && (theme === 'dark' ? 'text-white' : 'text-gray-900'),
                  step.status === 'error' && 'text-red-500',
                  step.status === 'pending' && (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className={clsx(
                    'text-xs mt-0.5',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal
  return (
    <div className={clsx('flex items-center', className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={clsx(
            'flex items-center',
            index > 0 && 'flex-1'
          )}
        >
          {renderConnector(index, index > 0 ? steps[index - 1].status : 'pending')}
          <div className={clsx('flex flex-col items-center', config.gap)}>
            {renderStepIcon(step, index)}
            <div className="text-center">
              <p className={clsx(
                config.text,
                'font-medium whitespace-nowrap',
                step.status === 'completed' && (theme === 'dark' ? 'text-gray-400' : 'text-gray-500'),
                step.status === 'active' && (theme === 'dark' ? 'text-white' : 'text-gray-900'),
                step.status === 'error' && 'text-red-500',
                step.status === 'pending' && (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
              )}>
                {step.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple step indicator (dots)
interface StepIndicatorProps {
  total: number;
  current: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StepIndicator({ total, current, size = 'md', className }: StepIndicatorProps) {
  const { theme } = useAppStore();

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'rounded-full transition-colors',
            dotSizes[size],
            index === current
              ? 'bg-omnifocus-purple'
              : index < current
                ? 'bg-green-500'
                : theme === 'dark'
                  ? 'bg-gray-600'
                  : 'bg-gray-300'
          )}
        />
      ))}
    </div>
  );
}

// Progress steps with percentage
interface ProgressStepperProps {
  steps: Array<{ label: string; value: number }>;
  currentValue: number;
  className?: string;
}

export function ProgressStepper({ steps, currentValue, className }: ProgressStepperProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx('relative', className)}>
      {/* Progress bar */}
      <div className={clsx(
        'h-2 rounded-full overflow-hidden',
        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
      )}>
        <div
          className="h-full bg-omnifocus-purple transition-all"
          style={{ width: `${currentValue}%` }}
        />
      </div>

      {/* Step markers */}
      <div className="relative mt-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${step.value}%` }}
          >
            <div className={clsx(
              'w-3 h-3 rounded-full border-2 -mt-4',
              currentValue >= step.value
                ? 'bg-omnifocus-purple border-omnifocus-purple'
                : theme === 'dark'
                  ? 'bg-omnifocus-bg border-gray-600'
                  : 'bg-white border-gray-300'
            )} />
            <span className={clsx(
              'text-xs mt-1 whitespace-nowrap',
              currentValue >= step.value
                ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Wizard steps with navigation
interface WizardStep {
  id: string;
  title: string;
  content: React.ReactNode;
  isValid?: boolean;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  showNavigation?: boolean;
  className?: string;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  showNavigation = true,
  className,
}: WizardStepperProps) {
  const { theme } = useAppStore();

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const goNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={className}>
      {/* Stepper header */}
      <Stepper
        steps={steps.map((step, index) => ({
          id: step.id,
          label: step.title,
          status: index < currentStep
            ? 'completed'
            : index === currentStep
              ? 'active'
              : 'pending',
        }))}
        className="mb-6"
      />

      {/* Content */}
      <div className="min-h-[200px]">
        {currentStepData.content}
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className={clsx(
          'flex items-center justify-between mt-6 pt-6 border-t',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <button
            onClick={goBack}
            disabled={isFirstStep}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isFirstStep
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                  ? 'text-gray-300 hover:bg-omnifocus-surface'
                  : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Back
          </button>

          <StepIndicator
            total={steps.length}
            current={currentStep}
          />

          <button
            onClick={goNext}
            disabled={currentStepData.isValid === false}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-omnifocus-purple text-white',
              currentStepData.isValid === false && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

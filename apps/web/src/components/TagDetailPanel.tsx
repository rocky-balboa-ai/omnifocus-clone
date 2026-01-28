'use client';

import { useAppStore } from '@/stores/app.store';
import { X, Clock } from 'lucide-react';
import clsx from 'clsx';

interface TagDetailPanelProps {
  tagId: string | null;
  onClose: () => void;
}

export function TagDetailPanel({ tagId, onClose }: TagDetailPanelProps) {
  const { tags, updateTag, theme } = useAppStore();

  const tag = tags.find((t) => t.id === tagId);

  if (!tagId || !tag) {
    return null;
  }

  const handleAvailableFromChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    await updateTag(tag.id, { availableFrom: value });
  };

  const handleAvailableUntilChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    await updateTag(tag.id, { availableUntil: value });
  };

  return (
    <div
      className={clsx(
        'fixed inset-y-0 right-0 w-full max-w-md z-50 shadow-xl',
        'transform transition-transform duration-200',
        theme === 'dark' ? 'bg-omnifocus-surface border-l border-omnifocus-border' : 'bg-white border-l border-gray-200'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <h2 className={clsx(
            'text-lg font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {tag.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-border text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Availability Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <h3 className={clsx(
                'text-sm font-medium',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Availability Window
              </h3>
            </div>
            <p className={clsx(
              'text-xs mb-4',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Tasks with this tag will only appear as available during this time window.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="availableFrom"
                  className={clsx(
                    'block text-sm mb-1.5',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Available from
                </label>
                <input
                  id="availableFrom"
                  type="time"
                  defaultValue={tag.availableFrom || ''}
                  onBlur={handleAvailableFromChange}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg border text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="availableUntil"
                  className={clsx(
                    'block text-sm mb-1.5',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Available until
                </label>
                <input
                  id="availableUntil"
                  type="time"
                  defaultValue={tag.availableUntil || ''}
                  onBlur={handleAvailableUntilChange}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg border text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  )}
                />
              </div>
            </div>

            {/* Availability preview */}
            {(tag.availableFrom || tag.availableUntil) && (
              <div className={clsx(
                'mt-4 p-3 rounded-lg text-sm',
                theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
              )}>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  This tag is available{' '}
                  {tag.availableFrom && tag.availableUntil ? (
                    <>from <strong className="text-omnifocus-purple">{tag.availableFrom}</strong> to <strong className="text-omnifocus-purple">{tag.availableUntil}</strong></>
                  ) : tag.availableFrom ? (
                    <>after <strong className="text-omnifocus-purple">{tag.availableFrom}</strong></>
                  ) : (
                    <>until <strong className="text-omnifocus-purple">{tag.availableUntil}</strong></>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  X,
  Calendar,
  FolderKanban,
  Tags,
  Flag,
  ChevronDown,
  Check,
  Zap,
  Clock,
  FileText,
  Timer,
} from 'lucide-react';
import clsx from 'clsx';
import { addDays, addWeeks, startOfTomorrow, nextMonday, format } from 'date-fns';

interface QuickEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickDueDates = [
  { label: 'Today', getValue: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Tomorrow', getValue: () => format(startOfTomorrow(), 'yyyy-MM-dd') },
  { label: 'Next Week', getValue: () => format(nextMonday(new Date()), 'yyyy-MM-dd') },
  { label: 'In 2 Weeks', getValue: () => format(addWeeks(new Date(), 2), 'yyyy-MM-dd') },
];

export function QuickEntryForm({ isOpen, onClose }: QuickEntryFormProps) {
  const { createAction, projects, tags, fetchActions, currentPerspective, theme } = useAppStore();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [deferDate, setDeferDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setNote('');
    setProjectId('');
    setSelectedTags([]);
    setDueDate('');
    setDeferDate('');
    setEstimatedMinutes('');
    setFlagged(false);
    setShowProjectPicker(false);
    setShowTagPicker(false);
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAction({
        title: title.trim(),
        note: note.trim() || undefined,
        projectId: projectId || undefined,
        dueDate: dueDate || undefined,
        deferDate: deferDate || undefined,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        flagged,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      } as any);

      // Refresh the current view
      fetchActions(currentPerspective);

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedProject = projects.find(p => p.id === projectId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Form - centered modal on desktop, bottom sheet on mobile */}
      <div className={clsx(
        'fixed z-50 overflow-hidden',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200',
        'border',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 rounded-t-2xl',
        // Desktop: centered modal
        'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:rounded-2xl md:max-h-[85vh]'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-omnifocus-purple" />
            <h2 className={clsx('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>New Action</h2>
          </div>
          <button
            onClick={handleClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            )}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={clsx(
                'w-full text-lg bg-transparent border-none outline-none placeholder-gray-500',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <FileText size={16} />
              Notes (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border text-sm resize-none',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              )}
              placeholder="Add details, links, or context..."
              rows={2}
            />
          </div>

          {/* Quick Due Date Buttons */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Calendar size={16} />
              Due Date
            </label>
            <div className="flex flex-wrap gap-2">
              {quickDueDates.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setDueDate(option.getValue())}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    dueDate === option.getValue()
                      ? 'bg-omnifocus-purple text-white'
                      : 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                  )}
                >
                  {option.label}
                </button>
              ))}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-1.5 rounded-full text-sm bg-omnifocus-surface text-gray-300 border-none"
              />
            </div>
          </div>

          {/* Project Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <FolderKanban size={16} />
              Project
            </label>
            <button
              type="button"
              onClick={() => { setShowProjectPicker(!showProjectPicker); setShowTagPicker(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-left"
            >
              <span className={selectedProject ? 'text-white' : 'text-gray-500'}>
                {selectedProject?.name || 'Inbox'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showProjectPicker && (
              <div className="mt-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border overflow-hidden max-h-40 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setProjectId(''); setShowProjectPicker(false); }}
                  className={clsx(
                    'w-full px-3 py-2 text-left hover:bg-omnifocus-border transition-colors',
                    !projectId ? 'text-omnifocus-purple' : 'text-gray-300'
                  )}
                >
                  Inbox
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProjectId(p.id); setShowProjectPicker(false); }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-omnifocus-border transition-colors',
                      projectId === p.id ? 'text-omnifocus-purple' : 'text-gray-300'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Tags size={16} />
              Tags
            </label>
            <button
              type="button"
              onClick={() => { setShowTagPicker(!showTagPicker); setShowProjectPicker(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-left"
            >
              <div className="flex flex-wrap gap-1">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <span key={tagId} className="px-2 py-0.5 rounded bg-omnifocus-purple/20 text-omnifocus-purple text-sm">
                        {tag.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </button>
            {showTagPicker && (
              <div className="mt-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border overflow-hidden max-h-40 overflow-y-auto">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-omnifocus-border transition-colors flex items-center justify-between',
                      selectedTags.includes(tag.id) ? 'text-omnifocus-purple' : 'text-gray-300'
                    )}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && <Check size={16} />}
                  </button>
                ))}
                {tags.length === 0 && (
                  <div className="px-3 py-2 text-gray-500">No tags available</div>
                )}
              </div>
            )}
          </div>

          {/* Flag Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Flag size={16} />
              Flag this action
            </label>
            <button
              type="button"
              onClick={() => setFlagged(!flagged)}
              className={clsx(
                'w-12 h-7 rounded-full transition-colors relative',
                flagged ? 'bg-omnifocus-orange' : 'bg-omnifocus-surface'
              )}
            >
              <div className={clsx(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                flagged ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown
              size={16}
              className={clsx('transition-transform', showAdvanced && 'rotate-180')}
            />
            <span>{showAdvanced ? 'Hide' : 'Show'} advanced options</span>
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-omnifocus-border">
              {/* Defer Date */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Clock size={16} />
                  Defer Until
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDeferDate(format(startOfTomorrow(), 'yyyy-MM-dd'))}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      deferDate === format(startOfTomorrow(), 'yyyy-MM-dd')
                        ? 'bg-omnifocus-purple text-white'
                        : 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                    )}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeferDate(format(nextMonday(new Date()), 'yyyy-MM-dd'))}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      deferDate === format(nextMonday(new Date()), 'yyyy-MM-dd')
                        ? 'bg-omnifocus-purple text-white'
                        : 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                    )}
                  >
                    Next Week
                  </button>
                  <input
                    type="date"
                    value={deferDate}
                    onChange={(e) => setDeferDate(e.target.value)}
                    className="px-3 py-1.5 rounded-full text-sm bg-omnifocus-surface text-gray-300 border-none"
                  />
                  {deferDate && (
                    <button
                      type="button"
                      onClick={() => setDeferDate('')}
                      className="px-2 py-1.5 rounded-full text-sm text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Action will be hidden until this date
                </p>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Timer size={16} />
                  Estimated Time
                </label>
                <div className="flex flex-wrap gap-2">
                  {[5, 15, 30, 60].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setEstimatedMinutes(String(minutes))}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        estimatedMinutes === String(minutes)
                          ? 'bg-omnifocus-purple text-white'
                          : 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                      )}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="min"
                    min="1"
                    className="w-20 px-3 py-1.5 rounded-full text-sm bg-omnifocus-surface text-gray-300 border-none text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-white transition-all',
              title.trim() && !isSubmitting
                ? 'bg-omnifocus-purple hover:bg-omnifocus-purple/90 active:scale-[0.98]'
                : 'bg-gray-600 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Creating...' : 'Create Action'}
          </button>
        </form>
      </div>
    </>
  );
}

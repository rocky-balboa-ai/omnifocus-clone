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
  const { createAction, projects, tags, fetchActions, currentPerspective } = useAppStore();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setProjectId('');
    setSelectedTags([]);
    setDueDate('');
    setFlagged(false);
    setShowProjectPicker(false);
    setShowTagPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAction({
        title: title.trim(),
        projectId: projectId || undefined,
        dueDate: dueDate || undefined,
        flagged,
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
        'fixed z-50 bg-omnifocus-sidebar border border-omnifocus-border overflow-hidden',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 rounded-t-2xl',
        // Desktop: centered modal
        'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:rounded-2xl md:max-h-[85vh]'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-omnifocus-border">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-omnifocus-purple" />
            <h2 className="text-lg font-semibold text-white">New Action</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg bg-transparent border-none outline-none text-white placeholder-gray-500"
              placeholder="What needs to be done?"
              autoFocus
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

'use client';

import { useState, useEffect } from 'react';
import { useAppStore, ActionTemplate } from '@/stores/app.store';
import {
  FileText,
  Plus,
  Trash2,
  Play,
  X,
  Flag,
  Clock,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import clsx from 'clsx';

interface TaskTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskTemplates({ isOpen, onClose }: TaskTemplatesProps) {
  const {
    theme,
    templates,
    projects,
    saveTemplate,
    deleteTemplate,
    createActionFromTemplate,
  } = useAppStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<ActionTemplate>>({
    name: '',
    title: '',
    note: '',
    flagged: false,
    estimatedMinutes: undefined,
    projectId: undefined,
    deferDays: undefined,
    dueDays: undefined,
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveTemplate = () => {
    if (!newTemplate.name?.trim() || !newTemplate.title?.trim()) return;

    saveTemplate({
      name: newTemplate.name.trim(),
      title: newTemplate.title.trim(),
      note: newTemplate.note?.trim(),
      flagged: newTemplate.flagged,
      estimatedMinutes: newTemplate.estimatedMinutes,
      projectId: newTemplate.projectId,
      deferDays: newTemplate.deferDays,
      dueDays: newTemplate.dueDays,
    });

    setNewTemplate({
      name: '',
      title: '',
      note: '',
      flagged: false,
      estimatedMinutes: undefined,
      projectId: undefined,
      deferDays: undefined,
      dueDays: undefined,
    });
    setShowNewForm(false);
  };

  const handleUseTemplate = async (templateId: string) => {
    await createActionFromTemplate(templateId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={clsx(
          'fixed z-50 overflow-hidden shadow-2xl',
          theme === 'dark' ? 'bg-omnifocus-sidebar border-omnifocus-border' : 'bg-white border-gray-200',
          'border',
          'inset-x-4 top-20 bottom-20',
          'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] md:top-24 md:bottom-auto md:max-h-[80vh]',
          'rounded-xl flex flex-col'
        )}
      >
        {/* Header */}
        <div
          className={clsx(
            'flex items-center justify-between px-4 py-3 border-b shrink-0',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-omnifocus-purple" />
            <h2 className={clsx('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Task Templates
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Empty state */}
          {templates.length === 0 && !showNewForm && (
            <div className="text-center py-12">
              <FileText size={48} className={clsx('mx-auto mb-4', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No templates yet</p>
              <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
                Create templates for tasks you do often
              </p>
            </div>
          )}

          {/* Template list */}
          {templates.length > 0 && (
            <div className="space-y-3 mb-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={clsx(
                    'p-3 rounded-lg border',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx('font-medium', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {template.name}
                      </h3>
                      <p className={clsx('text-sm mt-0.5', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                        {template.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {template.flagged && (
                          <span className="flex items-center gap-1 text-omnifocus-orange">
                            <Flag size={12} />
                            Flagged
                          </span>
                        )}
                        {template.estimatedMinutes && (
                          <span className={clsx('flex items-center gap-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                            <Clock size={12} />
                            {template.estimatedMinutes} min
                          </span>
                        )}
                        {template.dueDays !== undefined && (
                          <span className={clsx('flex items-center gap-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                            <Calendar size={12} />
                            Due +{template.dueDays}d
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
                        )}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className={clsx(
                          'p-1.5 rounded-lg transition-colors',
                          theme === 'dark'
                            ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                        )}
                        title="Delete template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New template form */}
          {showNewForm && (
            <div
              className={clsx(
                'p-4 rounded-lg border',
                theme === 'dark'
                  ? 'bg-omnifocus-bg border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}
            >
              <h3 className={clsx('font-medium mb-3', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                New Template
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Template name (e.g., Weekly Review)"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg border text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
                <input
                  type="text"
                  value={newTemplate.title || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  placeholder="Task title"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg border text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
                <textarea
                  value={newTemplate.note || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, note: e.target.value })}
                  placeholder="Notes (optional)"
                  rows={2}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg border text-sm resize-none',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.flagged || false}
                      onChange={(e) => setNewTemplate({ ...newTemplate, flagged: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                      Flagged
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <input
                      type="number"
                      value={newTemplate.estimatedMinutes || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Est. min"
                      className={clsx(
                        'w-20 px-2 py-1 rounded border text-sm',
                        theme === 'dark'
                          ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <input
                      type="number"
                      value={newTemplate.dueDays || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, dueDays: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Due +days"
                      className={clsx(
                        'w-24 px-2 py-1 rounded border text-sm',
                        theme === 'dark'
                          ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!newTemplate.name?.trim() || !newTemplate.title?.trim()}
                    className="px-4 py-2 rounded-lg bg-omnifocus-purple text-white text-sm font-medium hover:bg-omnifocus-purple/90 disabled:opacity-50"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewTemplate({
                        name: '',
                        title: '',
                        note: '',
                        flagged: false,
                        estimatedMinutes: undefined,
                        projectId: undefined,
                        deferDays: undefined,
                        dueDays: undefined,
                      });
                    }}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm',
                      theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={clsx(
            'px-4 py-3 border-t shrink-0',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}
        >
          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border hover:text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Plus size={16} />
              New Template
            </button>
          )}
        </div>
      </div>
    </>
  );
}

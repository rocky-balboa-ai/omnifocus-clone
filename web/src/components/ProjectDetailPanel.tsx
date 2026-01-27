'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Project } from '@/stores/app.store';
import {
  X,
  Flag,
  Calendar,
  FolderKanban,
  FileText,
  Trash2,
  Check,
  RefreshCw,
  Layers,
  List,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

interface ProjectDetailPanelProps {
  projectId: string | null;
  onClose: () => void;
}

const projectTypes = [
  { value: 'parallel', label: 'Parallel', description: 'All actions available at once', icon: Layers },
  { value: 'sequential', label: 'Sequential', description: 'One action at a time', icon: List },
  { value: 'single_actions', label: 'Single Actions', description: 'Unrelated actions', icon: FolderKanban },
];

const reviewIntervals = [
  { value: '', label: 'No Review' },
  { value: '1w', label: 'Weekly' },
  { value: '2w', label: 'Every 2 Weeks' },
  { value: '1m', label: 'Monthly' },
  { value: '3m', label: 'Quarterly' },
  { value: '1y', label: 'Yearly' },
];

export function ProjectDetailPanel({ projectId, onClose }: ProjectDetailPanelProps) {
  const { projects, updateProject } = useAppStore();
  const project = projects.find(p => p.id === projectId);

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'parallel' | 'sequential' | 'single_actions'>('parallel');
  const [dueDate, setDueDate] = useState('');
  const [deferDate, setDeferDate] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [reviewInterval, setReviewInterval] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setNote(project.note || '');
      setType(project.type);
      setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
      setDeferDate(project.deferDate ? project.deferDate.split('T')[0] : '');
      setFlagged(project.flagged);
      setReviewInterval(project.reviewInterval || '');
      setIsDirty(false);
    }
  }, [project]);

  if (!project) return null;

  const handleSave = async () => {
    await updateProject(project.id, {
      name,
      note: note || undefined,
      type,
      dueDate: dueDate || undefined,
      deferDate: deferDate || undefined,
      flagged,
      reviewInterval: reviewInterval || undefined,
    } as any);
    setIsDirty(false);
  };

  const markDirty = () => setIsDirty(true);

  const selectedType = projectTypes.find(t => t.value === type);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
        onClick={onClose}
      />

      {/* Panel - slides up on mobile, side panel on desktop */}
      <div className={clsx(
        'fixed z-50 bg-omnifocus-sidebar border-omnifocus-border overflow-hidden',
        'flex flex-col',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t',
        // Desktop: side panel
        'md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-none md:rounded-none md:border-l md:border-t-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-omnifocus-border">
          <div className="flex items-center gap-2">
            <FolderKanban size={20} className="text-blue-400" />
            <span className="text-sm text-gray-400">Project</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setFlagged(!flagged); markDirty(); }}
              className={clsx(
                'p-2 rounded-lg hover:bg-omnifocus-surface transition-colors',
                flagged ? 'text-omnifocus-orange' : 'text-gray-400 hover:text-omnifocus-orange'
              )}
              title="Flag"
            >
              <Flag size={20} fill={flagged ? 'currentColor' : 'none'} />
            </button>

            {isDirty && (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white text-sm font-medium hover:bg-omnifocus-purple/90 transition-colors"
              >
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            className="w-full text-xl font-semibold bg-transparent border-none outline-none text-white placeholder-gray-500"
            placeholder="Project name"
          />

          {/* Note */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <FileText size={16} />
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); markDirty(); }}
              className="w-full h-24 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white placeholder-gray-500 resize-none"
              placeholder="Add notes..."
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Layers size={16} />
              Project Type
            </label>
            <button
              onClick={() => setShowTypePicker(!showTypePicker)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-left"
            >
              <div className="flex items-center gap-2">
                {selectedType && <selectedType.icon size={16} className="text-omnifocus-purple" />}
                <span className="text-white">{selectedType?.label}</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showTypePicker && (
              <div className="mt-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border overflow-hidden">
                {projectTypes.map(pt => (
                  <button
                    key={pt.value}
                    onClick={() => { setType(pt.value as any); setShowTypePicker(false); markDirty(); }}
                    className={clsx(
                      'w-full px-3 py-3 text-left hover:bg-omnifocus-border transition-colors',
                      type === pt.value ? 'bg-omnifocus-purple/10' : ''
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <pt.icon size={16} className={type === pt.value ? 'text-omnifocus-purple' : 'text-gray-400'} />
                      <span className={type === pt.value ? 'text-omnifocus-purple' : 'text-gray-300'}>
                        {pt.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">{pt.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Calendar size={16} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
                className="w-full px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Calendar size={16} />
                Defer Until
              </label>
              <input
                type="date"
                value={deferDate}
                onChange={(e) => { setDeferDate(e.target.value); markDirty(); }}
                className="w-full px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
              />
            </div>
          </div>

          {/* Review Interval */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <RefreshCw size={16} />
              Review Interval
            </label>
            <select
              value={reviewInterval}
              onChange={(e) => { setReviewInterval(e.target.value); markDirty(); }}
              className="w-full px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
            >
              {reviewIntervals.map(ri => (
                <option key={ri.value} value={ri.value}>{ri.label}</option>
              ))}
            </select>
          </div>

          {/* Actions count */}
          <div className="pt-4 border-t border-omnifocus-border">
            <p className="text-sm text-gray-400">
              {project._count?.actions || 0} actions in this project
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

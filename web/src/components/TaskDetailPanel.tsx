'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, Action, Attachment } from '@/stores/app.store';
import { api } from '@/lib/api';
import {
  X,
  Flag,
  Calendar,
  Clock,
  FolderKanban,
  Tags,
  Repeat,
  FileText,
  Trash2,
  Check,
  ChevronDown,
  Paperclip,
  Upload,
  File,
  Image,
  Download,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface TaskDetailPanelProps {
  actionId: string | null;
  onClose: () => void;
}

export function TaskDetailPanel({ actionId, onClose }: TaskDetailPanelProps) {
  const { actions, projects, tags, updateAction, deleteAction, completeAction } = useAppStore();
  const action = actions.find(a => a.id === actionId);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deferDate, setDeferDate] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<string | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [repeatMode, setRepeatMode] = useState<string>('');
  const [repeatInterval, setRepeatInterval] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (action) {
      setTitle(action.title);
      setNote(action.note || '');
      setDueDate(action.dueDate ? action.dueDate.split('T')[0] : '');
      setDeferDate(action.deferDate ? action.deferDate.split('T')[0] : '');
      setPlannedDate(action.plannedDate ? action.plannedDate.split('T')[0] : '');
      setFlagged(action.flagged);
      setEstimatedMinutes(action.estimatedMinutes || '');
      setProjectId(action.projectId || '');
      setSelectedTags(action.tags?.map(t => t.tag.id) || []);
      setRepeatMode((action as any).repeatMode || '');
      setRepeatInterval((action as any).repeatInterval || '');
      setAttachments(action.attachments || []);
      setIsDirty(false);
    }
  }, [action]);

  if (!action) return null;

  const handleSave = async () => {
    await updateAction(action.id, {
      title,
      note: note || undefined,
      dueDate: dueDate || undefined,
      deferDate: deferDate || undefined,
      plannedDate: plannedDate || undefined,
      flagged,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      projectId: projectId || undefined,
      repeatMode: repeatMode || undefined,
      repeatInterval: repeatInterval || undefined,
    } as any);
    setIsDirty(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this action?')) {
      await deleteAction(action.id);
      onClose();
    }
  };

  const handleComplete = async () => {
    await completeAction(action.id);
    onClose();
  };

  const markDirty = () => setIsDirty(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !action) return;

    setIsUploading(true);
    try {
      const file = files[0];
      const attachment = await api.uploadFile<Attachment>(
        `/attachments/actions/${action.id}`,
        file
      );
      setAttachments(prev => [attachment, ...prev]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      await api.delete(`/attachments/${attachmentId}`);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  const selectedProject = projects.find(p => p.id === projectId);

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
            <button
              onClick={handleComplete}
              className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-green-500 transition-colors"
              title="Complete"
            >
              <Check size={20} />
            </button>
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
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white text-sm font-medium hover:bg-omnifocus-purple/90 transition-colors"
              >
                Save
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
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
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className="w-full text-xl font-semibold bg-transparent border-none outline-none text-white placeholder-gray-500"
            placeholder="Action title"
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

          {/* Project */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <FolderKanban size={16} />
              Project
            </label>
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-left"
            >
              <span className={selectedProject ? 'text-white' : 'text-gray-500'}>
                {selectedProject?.name || 'No Project (Inbox)'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showProjectPicker && (
              <div className="mt-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border overflow-hidden">
                <button
                  onClick={() => { setProjectId(''); setShowProjectPicker(false); markDirty(); }}
                  className={clsx(
                    'w-full px-3 py-2 text-left hover:bg-omnifocus-border transition-colors',
                    !projectId ? 'text-omnifocus-purple' : 'text-gray-300'
                  )}
                >
                  No Project (Inbox)
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setProjectId(p.id); setShowProjectPicker(false); markDirty(); }}
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

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Tags size={16} />
              Tags
            </label>
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
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
              <div className="mt-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border overflow-hidden max-h-48 overflow-y-auto">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                      markDirty();
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

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Calendar size={16} />
              Planned Date
            </label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => { setPlannedDate(e.target.value); markDirty(); }}
              className="w-full px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
            />
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Clock size={16} />
              Estimated Duration
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[5, 15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => { setEstimatedMinutes(mins); markDirty(); }}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    estimatedMinutes === mins
                      ? 'bg-omnifocus-purple text-white'
                      : 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                  )}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => { setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : ''); markDirty(); }}
                className="w-20 px-3 py-1.5 rounded-full text-sm bg-omnifocus-surface border border-omnifocus-border text-white text-center"
                placeholder="Custom"
                min="0"
              />
            </div>
          </div>

          {/* Repeat Settings */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Repeat size={16} />
              Repeat
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={repeatMode}
                onChange={(e) => { setRepeatMode(e.target.value); markDirty(); }}
                className="px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
              >
                <option value="">No Repeat</option>
                <option value="fixed">Fixed Schedule</option>
                <option value="defer_another">Defer Another</option>
                <option value="due_again">Due Again</option>
              </select>
              {repeatMode && (
                <select
                  value={repeatInterval}
                  onChange={(e) => { setRepeatInterval(e.target.value); markDirty(); }}
                  className="px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white"
                >
                  <option value="1d">Daily</option>
                  <option value="1w">Weekly</option>
                  <option value="2w">Every 2 Weeks</option>
                  <option value="1m">Monthly</option>
                  <option value="3m">Quarterly</option>
                  <option value="1y">Yearly</option>
                </select>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Paperclip size={16} />
              Attachments
            </label>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-colors',
                isUploading
                  ? 'border-omnifocus-purple/50 bg-omnifocus-purple/10 cursor-not-allowed'
                  : 'border-omnifocus-border hover:border-omnifocus-purple/50 hover:bg-omnifocus-surface'
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-omnifocus-purple" />
                  <span className="text-gray-400">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-gray-400">Click to upload a file</span>
                </>
              )}
            </button>

            {/* Attachment list */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-omnifocus-surface border border-omnifocus-border group"
                  >
                    {/* Icon or thumbnail */}
                    {isImageFile(attachment.mimeType) ? (
                      <div className="w-10 h-10 rounded bg-omnifocus-border overflow-hidden shrink-0">
                        <img
                          src={api.getFileUrl(attachment.url)}
                          alt={attachment.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-omnifocus-border flex items-center justify-center shrink-0">
                        <File size={20} className="text-gray-400" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{attachment.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={api.getFileUrl(attachment.url)}
                        download={attachment.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-omnifocus-border text-gray-400 hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-1.5 rounded hover:bg-omnifocus-border text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

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
  Eye,
  Edit3,
  Link,
} from 'lucide-react';
import { BlockingPicker } from './BlockingPicker';
import { LinkAttachment, LinkItem } from './LinkAttachment';
import { MarkdownPreview, hasMarkdown } from './MarkdownPreview';
import clsx from 'clsx';
import { format } from 'date-fns';

interface TaskDetailPanelProps {
  actionId: string | null;
  onClose: () => void;
}

export function TaskDetailPanel({ actionId, onClose }: TaskDetailPanelProps) {
  const { actions, projects, tags, updateAction, deleteAction, completeAction, theme } = useAppStore();
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
  const [showBlockingPicker, setShowBlockingPicker] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isNotePreview, setIsNotePreview] = useState(false);
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
      setLinks(action.links || []);
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

  const handleAddLink = async (link: { url: string; title: string }) => {
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      url: link.url,
      title: link.title,
    };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    await updateAction(action.id, { links: updatedLinks } as any);
  };

  const handleRemoveLink = async (linkId: string) => {
    const updatedLinks = links.filter(l => l.id !== linkId);
    setLinks(updatedLinks);
    await updateAction(action.id, { links: updatedLinks } as any);
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
        className="fixed inset-0 bg-black/50 z-40 md:bg-black/30 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel - slides up on mobile, side panel on desktop */}
      <div
        data-testid="task-detail-panel"
        className={clsx(
          'fixed z-50 overflow-hidden',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          'animate-slide-in-right',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t',
          // Desktop: side panel
          'md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-none md:rounded-none md:border-l md:border-t-0'
        )}
      >
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleComplete}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-green-500'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
              )}
              title="Complete"
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => { setFlagged(!flagged); markDirty(); }}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                flagged
                  ? 'text-omnifocus-orange'
                  : theme === 'dark'
                    ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-omnifocus-orange'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-omnifocus-orange'
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
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-red-500'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
              )}
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className={clsx(
              'w-full text-xl font-semibold bg-transparent border-none outline-none placeholder-gray-500',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
            placeholder="Action title"
          />

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={clsx('flex items-center gap-2 text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                <FileText size={16} />
                Notes
                {hasMarkdown(note) && (
                  <span className={clsx(
                    'text-xs px-1.5 py-0.5 rounded',
                    theme === 'dark' ? 'bg-omnifocus-surface text-gray-500' : 'bg-gray-100 text-gray-400'
                  )}>
                    Markdown
                  </span>
                )}
              </label>
              {note && (
                <button
                  onClick={() => setIsNotePreview(!isNotePreview)}
                  className={clsx(
                    'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
                    isNotePreview
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : theme === 'dark'
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {isNotePreview ? <Edit3 size={12} /> : <Eye size={12} />}
                  {isNotePreview ? 'Edit' : 'Preview'}
                </button>
              )}
            </div>
            {isNotePreview && note ? (
              <div className={clsx(
                'w-full min-h-[96px] px-3 py-2 rounded-lg border',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-gray-50 border-gray-200'
              )}>
                <MarkdownPreview content={note} />
              </div>
            ) : (
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); markDirty(); }}
                className={clsx(
                  'w-full h-24 px-3 py-2 rounded-lg border placeholder-gray-500 resize-none',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
                placeholder="Add notes... (supports **markdown**)"
              />
            )}
          </div>

          {/* Project */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <FolderKanban size={16} />
              Project
            </label>
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <span className={selectedProject ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : 'text-gray-500'}>
                {selectedProject?.name || 'No Project (Inbox)'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showProjectPicker && (
              <div className={clsx(
                'mt-2 rounded-lg border overflow-hidden',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                <button
                  onClick={() => { setProjectId(''); setShowProjectPicker(false); markDirty(); }}
                  className={clsx(
                    'w-full px-3 py-2 text-left transition-colors',
                    theme === 'dark' ? 'hover:bg-omnifocus-border' : 'hover:bg-gray-100',
                    !projectId ? 'text-omnifocus-purple' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
                  )}
                >
                  No Project (Inbox)
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setProjectId(p.id); setShowProjectPicker(false); markDirty(); }}
                    className={clsx(
                      'w-full px-3 py-2 text-left transition-colors',
                      theme === 'dark' ? 'hover:bg-omnifocus-border' : 'hover:bg-gray-100',
                      projectId === p.id ? 'text-omnifocus-purple' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
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
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <Tags size={16} />
              Tags
            </label>
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-gray-50 border-gray-200'
              )}
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
              <div className={clsx(
                'mt-2 rounded-lg border overflow-hidden max-h-48 overflow-y-auto',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
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
                      'w-full px-3 py-2 text-left transition-colors flex items-center justify-between',
                      theme === 'dark' ? 'hover:bg-omnifocus-border' : 'hover:bg-gray-100',
                      selectedTags.includes(tag.id) ? 'text-omnifocus-purple' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
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
              <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                <Calendar size={16} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
            </div>
            <div>
              <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                <Calendar size={16} />
                Defer Until
              </label>
              <input
                type="date"
                value={deferDate}
                onChange={(e) => { setDeferDate(e.target.value); markDirty(); }}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
            </div>
          </div>

          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <Calendar size={16} />
              Planned Date
            </label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => { setPlannedDate(e.target.value); markDirty(); }}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              )}
            />
          </div>

          {/* Estimated Duration */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
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
                      : theme === 'dark'
                        ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => { setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : ''); markDirty(); }}
                className={clsx(
                  'w-20 px-3 py-1.5 rounded-full text-sm border text-center',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
                placeholder="Custom"
                min="0"
              />
            </div>
          </div>

          {/* Repeat Settings */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <Repeat size={16} />
              Repeat
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={repeatMode}
                onChange={(e) => { setRepeatMode(e.target.value); markDirty(); }}
                className={clsx(
                  'px-3 py-2 rounded-lg border',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
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
                  className={clsx(
                    'px-3 py-2 rounded-lg border',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  )}
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

          {/* Blocked By */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <Link size={16} />
              Blocked By
            </label>
            {action.blockedBy && action.blockedBy.length > 0 ? (
              <div className="space-y-1 mb-2">
                {action.blockedBy.map((blockingId) => {
                  const blockingAction = actions.find(a => a.id === blockingId);
                  return blockingAction ? (
                    <div
                      key={blockingId}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
                      )}
                    >
                      <span className={clsx(
                        'w-2 h-2 rounded-full',
                        blockingAction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      )} />
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {blockingAction.title}
                      </span>
                      {blockingAction.status === 'completed' && (
                        <Check size={14} className="text-green-500 ml-auto" />
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className={clsx('text-sm mb-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                No blocking tasks
              </p>
            )}
            <button
              onClick={() => setShowBlockingPicker(true)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface hover:bg-omnifocus-border text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              {action.blockedBy && action.blockedBy.length > 0 ? 'Edit blocking tasks' : 'Add blocking task'}
            </button>
          </div>

          {/* Attachments */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
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
                  : theme === 'dark'
                    ? 'border-omnifocus-border hover:border-omnifocus-purple/50 hover:bg-omnifocus-surface'
                    : 'border-gray-300 hover:border-omnifocus-purple/50 hover:bg-gray-50'
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
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border group',
                      theme === 'dark'
                        ? 'bg-omnifocus-surface border-omnifocus-border'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    {/* Icon or thumbnail */}
                    {isImageFile(attachment.mimeType) ? (
                      <div className={clsx(
                        'w-10 h-10 rounded overflow-hidden shrink-0',
                        theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
                      )}>
                        <img
                          src={api.getFileUrl(attachment.url)}
                          alt={attachment.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={clsx(
                        'w-10 h-10 rounded flex items-center justify-center shrink-0',
                        theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
                      )}>
                        <File size={20} className="text-gray-400" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>{attachment.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={api.getFileUrl(attachment.url)}
                        download={attachment.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          theme === 'dark'
                            ? 'hover:bg-omnifocus-border text-gray-400 hover:text-white'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                        )}
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          theme === 'dark'
                            ? 'hover:bg-omnifocus-border text-gray-400 hover:text-red-500'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                        )}
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

          {/* Links */}
          <div>
            <label className={clsx('flex items-center gap-2 text-sm mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              <Link size={16} />
              Links
            </label>
            <LinkAttachment
              links={links}
              onAdd={handleAddLink}
              onRemove={handleRemoveLink}
            />
          </div>
        </div>
      </div>

      {/* Blocking Picker Modal */}
      {showBlockingPicker && (
        <BlockingPicker
          actionId={action.id}
          onClose={() => setShowBlockingPicker(false)}
        />
      )}
    </>
  );
}

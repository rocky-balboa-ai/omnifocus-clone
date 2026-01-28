'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import {
  CheckCircle2,
  Flag,
  Calendar,
  Trash2,
  Copy,
  CopyPlus,
  Clipboard,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  FolderOpen,
  Tag,
  MoreHorizontal,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { addDays, startOfDay } from 'date-fns';
import clsx from 'clsx';

interface ActionContextMenuProps {
  action: Action;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ActionContextMenu({ action, position, onClose }: ActionContextMenuProps) {
  const {
    theme,
    updateAction,
    completeAction,
    deleteAction,
    createAction,
    indentAction,
    outdentAction,
    fetchActions,
    currentPerspective,
    projects,
  } = useAppStore();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const handleComplete = async () => {
    await completeAction(action.id);
    fetchActions(currentPerspective);
    onClose();
  };

  const handleToggleFlag = async () => {
    await updateAction(action.id, { flagged: !action.flagged });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleSetDueToday = async () => {
    await updateAction(action.id, { dueDate: today.toISOString() });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleSetDueTomorrow = async () => {
    await updateAction(action.id, { dueDate: tomorrow.toISOString() });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleClearDueDate = async () => {
    await updateAction(action.id, { dueDate: undefined });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleDelete = async () => {
    await deleteAction(action.id);
    fetchActions(currentPerspective);
    onClose();
  };

  const handleIndent = async () => {
    await indentAction(action.id);
    onClose();
  };

  const handleOutdent = async () => {
    await outdentAction(action.id);
    onClose();
  };

  const handleAddSubtask = async () => {
    await createAction({
      title: 'New Subtask',
      parentId: action.id,
      projectId: action.projectId,
    });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(action.title);
    onClose();
  };

  const handleDuplicate = async () => {
    // Copy relevant properties but not blockedBy (new task is independent)
    const tagIds = action.tags?.map((t: any) => t.tagId || t.tag?.id).filter(Boolean) || [];

    await createAction({
      title: action.title,
      notes: action.notes,
      flagged: action.flagged,
      dueDate: action.dueDate,
      deferDate: action.deferDate,
      projectId: action.projectId,
      parentId: action.parentId,
      tagIds,
      estimatedMinutes: action.estimatedMinutes,
    });
    fetchActions(currentPerspective);
    onClose();
  };

  const handleMoveToProject = async (projectId: string | null) => {
    await updateAction(action.id, { projectId: projectId || undefined });
    fetchActions(currentPerspective);
    onClose();
  };

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    danger = false,
    disabled = false,
    shortcut,
  }: {
    icon: any;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    shortcut?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && (
          danger
            ? theme === 'dark'
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-red-600 hover:bg-red-50'
            : theme === 'dark'
              ? 'text-gray-300 hover:bg-omnifocus-surface'
              : 'text-gray-700 hover:bg-gray-50'
        )
      )}
    >
      <Icon size={16} className={danger ? '' : 'text-gray-400'} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className={clsx(
          'text-xs px-1.5 py-0.5 rounded',
          theme === 'dark' ? 'bg-omnifocus-bg text-gray-500' : 'bg-gray-100 text-gray-400'
        )}>
          {shortcut}
        </kbd>
      )}
    </button>
  );

  const Divider = () => (
    <div className={clsx(
      'my-1 border-t',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-100'
    )} />
  );

  return (
    <div
      ref={menuRef}
      className={clsx(
        'fixed z-50 py-2 rounded-lg shadow-xl border min-w-[200px]',
        'animate-in fade-in zoom-in-95 duration-100',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem
        icon={action.status === 'completed' ? Clock : CheckCircle2}
        label={action.status === 'completed' ? 'Mark Incomplete' : 'Complete'}
        onClick={handleComplete}
        shortcut="Space"
      />
      <MenuItem
        icon={Flag}
        label={action.flagged ? 'Unflag' : 'Flag'}
        onClick={handleToggleFlag}
        shortcut="F"
      />

      <Divider />

      <MenuItem
        icon={Sun}
        label="Due Today"
        onClick={handleSetDueToday}
        shortcut="D"
      />
      <MenuItem
        icon={Moon}
        label="Due Tomorrow"
        onClick={handleSetDueTomorrow}
        shortcut="T"
      />
      {action.dueDate && (
        <MenuItem
          icon={Calendar}
          label="Clear Due Date"
          onClick={handleClearDueDate}
        />
      )}

      <Divider />

      {/* Move to Project submenu placeholder - simplified inline */}
      <div className={clsx(
        'px-3 py-1.5 text-xs font-medium uppercase tracking-wide',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        Move to Project
      </div>
      <button
        onClick={() => handleMoveToProject(null)}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors',
          theme === 'dark'
            ? 'text-gray-400 hover:bg-omnifocus-surface'
            : 'text-gray-500 hover:bg-gray-50'
        )}
      >
        <ArrowRight size={14} className="text-gray-400" />
        No Project (Inbox)
      </button>
      {projects.filter(p => p.status === 'active').slice(0, 5).map(project => (
        <button
          key={project.id}
          onClick={() => handleMoveToProject(project.id)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors',
            project.id === action.projectId
              ? theme === 'dark'
                ? 'bg-omnifocus-purple/10 text-omnifocus-purple'
                : 'bg-purple-50 text-purple-700'
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <FolderOpen size={14} className="text-omnifocus-purple" />
          <span className="truncate">{project.name}</span>
        </button>
      ))}

      <Divider />

      <MenuItem
        icon={ArrowUp}
        label="Indent (Make Subtask)"
        onClick={handleIndent}
        shortcut="⌘]"
      />
      <MenuItem
        icon={ArrowDown}
        label="Outdent"
        onClick={handleOutdent}
        shortcut="⌘["
      />
      <MenuItem
        icon={Plus}
        label="Add Subtask"
        onClick={handleAddSubtask}
      />

      <Divider />

      <MenuItem
        icon={Copy}
        label="Copy Title"
        onClick={handleCopyTitle}
      />
      <MenuItem
        icon={CopyPlus}
        label="Duplicate"
        onClick={handleDuplicate}
        shortcut="⌘D"
      />

      <Divider />

      <MenuItem
        icon={Trash2}
        label="Delete"
        onClick={handleDelete}
        danger
        shortcut="⌫"
      />
    </div>
  );
}

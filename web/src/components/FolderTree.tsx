'use client';

import { useState, useMemo } from 'react';
import { useAppStore, Folder, Project } from '@/stores/app.store';
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Layers } from 'lucide-react';
import clsx from 'clsx';

interface FolderNodeProps {
  folder: Folder;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

function FolderNode({ folder, depth, expandedIds, onToggleExpand }: FolderNodeProps) {
  const { theme, selectedFolderId, setSelectedFolderId, folders } = useAppStore();

  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;

  // Find child folders
  const childFolders = useMemo(() =>
    folders.filter(f => f.parentId === folder.id),
    [folders, folder.id]
  );

  const hasChildren = childFolders.length > 0;

  const handleClick = () => {
    setSelectedFolderId(folder.id);
    if (hasChildren) {
      onToggleExpand(folder.id);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={clsx(
          'w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors',
          isSelected
            ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
            : theme === 'dark'
              ? 'text-gray-300 hover:bg-omnifocus-surface'
              : 'text-gray-700 hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={14} className="shrink-0 text-gray-500" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-gray-500" />
          )
        ) : (
          <span className="w-3.5" /> // Spacer for alignment
        )}

        {isExpanded ? (
          <FolderOpen size={16} className="shrink-0 text-yellow-500" />
        ) : (
          <FolderIcon size={16} className="shrink-0 text-yellow-500" />
        )}

        <span className="truncate">{folder.name}</span>
      </button>

      {isExpanded && hasChildren && (
        <div>
          {childFolders.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree() {
  const { theme, folders, selectedFolderId, setSelectedFolderId } = useAppStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Get root folders (no parent)
  const rootFolders = useMemo(() =>
    folders.filter(f => !f.parentId),
    [folders]
  );

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedFolderId(null);
  };

  return (
    <div className={clsx(
      'h-full flex flex-col',
      theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
    )}>
      <div className={clsx(
        'px-3 py-2 border-b',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <h3 className={clsx(
          'text-xs font-semibold uppercase tracking-wide',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          Folders
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* All Projects option */}
        <button
          onClick={handleSelectAll}
          className={clsx(
            'w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors mb-1',
            selectedFolderId === null
              ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Layers size={16} className="shrink-0 text-blue-400" />
          <span>All Projects</span>
        </button>

        {/* Folder tree */}
        {rootFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={0}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

const perspectiveIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  inbox: Inbox,
  projects: FolderKanban,
  tags: Tags,
  forecast: Calendar,
  flagged: Flag,
  review: RefreshCw,
};

const perspectiveOrder = ['inbox', 'projects', 'tags', 'forecast', 'flagged', 'review'];

export function BottomNav() {
  const { perspectives, currentPerspective, setCurrentPerspective } = useAppStore();

  // Get perspectives in the correct order
  const orderedPerspectives = perspectiveOrder
    .map(id => perspectives.find(p => p.id === id))
    .filter(Boolean);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-omnifocus-sidebar/95 backdrop-blur-lg border-t border-omnifocus-border z-40">
      <div className="flex items-center justify-around px-1 pb-safe">
        {orderedPerspectives.map((perspective) => {
          if (!perspective) return null;
          const Icon = perspectiveIcons[perspective.id] || Inbox;
          const isActive = currentPerspective === perspective.id;

          return (
            <button
              key={perspective.id}
              onClick={() => setCurrentPerspective(perspective.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
                isActive
                  ? 'text-omnifocus-purple'
                  : 'text-gray-500 active:scale-95'
              )}
            >
              <Icon
                size={24}
                className={clsx(
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className={clsx(
                'text-[10px] mt-0.5 font-medium',
                isActive ? 'text-omnifocus-purple' : 'text-gray-500'
              )}>
                {perspective.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

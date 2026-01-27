'use client';

import { useMemo } from 'react';
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
import { isBefore, isToday, startOfDay } from 'date-fns';

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
  const { perspectives, currentPerspective, setCurrentPerspective, actions, projects, theme } = useAppStore();

  // Calculate badge counts for each perspective
  const badgeCounts = useMemo(() => {
    const today = startOfDay(new Date());
    const activeActions = actions.filter(a => a.status === 'active');

    return {
      inbox: activeActions.filter(a => !a.projectId).length,
      flagged: activeActions.filter(a => a.flagged).length,
      forecast: activeActions.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return isBefore(dueDate, today) || isToday(dueDate);
      }).length,
      review: projects.filter(p => {
        if (p.status !== 'active' || !p.reviewInterval) return false;
        if (!p.nextReviewAt) return true;
        return isBefore(new Date(p.nextReviewAt), today) || isToday(new Date(p.nextReviewAt));
      }).length,
    };
  }, [actions, projects]);

  // Get perspectives in the correct order
  const orderedPerspectives = perspectiveOrder
    .map(id => perspectives.find(p => p.id === id))
    .filter(Boolean);

  return (
    <nav className={clsx(
      'md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-40',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar/95 border-omnifocus-border'
        : 'bg-white/95 border-gray-200'
    )}>
      <div className="flex items-center justify-around px-1 pb-safe">
        {orderedPerspectives.map((perspective) => {
          if (!perspective) return null;
          const Icon = perspectiveIcons[perspective.id] || Inbox;
          const isActive = currentPerspective === perspective.id;
          const badgeCount = badgeCounts[perspective.id as keyof typeof badgeCounts] || 0;

          return (
            <button
              key={perspective.id}
              onClick={() => setCurrentPerspective(perspective.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
                isActive
                  ? 'text-omnifocus-purple'
                  : theme === 'dark' ? 'text-gray-500 active:scale-95' : 'text-gray-400 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={clsx(
                    'transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {badgeCount > 0 && (
                  <span className={clsx(
                    'absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold',
                    perspective.id === 'forecast'
                      ? 'bg-red-500 text-white'
                      : 'bg-omnifocus-purple text-white'
                  )}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={clsx(
                'text-[10px] mt-0.5 font-medium',
                isActive
                  ? 'text-omnifocus-purple'
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
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

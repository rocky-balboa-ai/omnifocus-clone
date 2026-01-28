'use client';

import { useAppStore } from '@/stores/app.store';
import { Link2 } from 'lucide-react';
import clsx from 'clsx';

interface BlockedIndicatorProps {
  blockedBy: string[];
}

export function BlockedIndicator({ blockedBy }: BlockedIndicatorProps) {
  const { actions } = useAppStore();

  if (!blockedBy || blockedBy.length === 0) {
    return null;
  }

  // Check if all blocking tasks are completed
  const blockingActions = blockedBy
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean);

  const allCompleted = blockingActions.every((a) => a?.status === 'completed');
  const count = blockedBy.length;

  const title = `Blocked by ${count} task${count > 1 ? 's' : ''}`;

  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs shrink-0',
        allCompleted ? 'text-green-500' : 'text-yellow-500'
      )}
    >
      <Link2 size={12} />
      {count > 1 && <span className="text-[10px]">{count}</span>}
    </span>
  );
}

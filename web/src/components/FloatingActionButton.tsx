'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

interface FABProps {
  onClick?: () => void;
}

export function FloatingActionButton({ onClick }: FABProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        md:hidden fixed right-4 bottom-20 z-50
        w-14 h-14 rounded-full
        bg-omnifocus-purple shadow-lg shadow-omnifocus-purple/30
        flex items-center justify-center
        transition-all duration-200 ease-out
        active:scale-90
        ${isPressed ? 'scale-90 shadow-md' : 'scale-100'}
      `}
      aria-label="New Action"
    >
      <Plus size={28} className="text-white" strokeWidth={2.5} />
    </button>
  );
}

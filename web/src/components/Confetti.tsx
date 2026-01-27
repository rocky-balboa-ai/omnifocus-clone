'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import clsx from 'clsx';

// Confetti piece component
interface ConfettiPieceProps {
  style: React.CSSProperties;
  color: string;
  shape: 'square' | 'circle' | 'triangle';
}

function ConfettiPiece({ style, color, shape }: ConfettiPieceProps) {
  if (shape === 'circle') {
    return (
      <div
        className="absolute rounded-full"
        style={{
          ...style,
          backgroundColor: color,
        }}
      />
    );
  }

  if (shape === 'triangle') {
    return (
      <div
        className="absolute"
        style={{
          ...style,
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderBottom: `10px solid ${color}`,
        }}
      />
    );
  }

  return (
    <div
      className="absolute"
      style={{
        ...style,
        backgroundColor: color,
      }}
    />
  );
}

// Main confetti display
interface ConfettiDisplayProps {
  active: boolean;
  onComplete?: () => void;
  pieceCount?: number;
  duration?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

const DEFAULT_COLORS = [
  '#8B5CF6', // purple
  '#10B981', // green
  '#3B82F6', // blue
  '#F97316', // orange
  '#EC4899', // pink
  '#FBBF24', // yellow
  '#EF4444', // red
];

function ConfettiDisplay({
  active,
  onComplete,
  pieceCount = 50,
  duration = 3000,
  colors = DEFAULT_COLORS,
  origin = { x: 0.5, y: 0.5 },
}: ConfettiDisplayProps) {
  const [pieces, setPieces] = useState<Array<{
    id: number;
    style: React.CSSProperties;
    color: string;
    shape: 'square' | 'circle' | 'triangle';
  }>>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const shapes: ('square' | 'circle' | 'triangle')[] = ['square', 'circle', 'triangle'];
    const newPieces = Array.from({ length: pieceCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 150;
      const size = 6 + Math.random() * 8;
      const rotation = Math.random() * 360;
      const rotationSpeed = (Math.random() - 0.5) * 720;

      return {
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        style: {
          left: `${origin.x * 100}%`,
          top: `${origin.y * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotate(${rotation}deg)`,
          '--tx': `${Math.cos(angle) * velocity}px`,
          '--ty': `${Math.sin(angle) * velocity - 200}px`,
          '--r': `${rotationSpeed}deg`,
          animation: `confetti-fall ${duration}ms ease-out forwards`,
        } as React.CSSProperties,
      };
    });

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, pieceCount, duration, colors, origin, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), calc(var(--ty) + 500px)) rotate(var(--r));
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          style={piece.style}
          color={piece.color}
          shape={piece.shape}
        />
      ))}
    </div>
  );
}

// Context for triggering confetti from anywhere
interface ConfettiContextType {
  trigger: (options?: Partial<ConfettiDisplayProps>) => void;
  triggerFromElement: (element: HTMLElement, options?: Partial<ConfettiDisplayProps>) => void;
}

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
}

interface ConfettiProviderProps {
  children: React.ReactNode;
}

export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [options, setOptions] = useState<Partial<ConfettiDisplayProps>>({});

  const trigger = useCallback((opts?: Partial<ConfettiDisplayProps>) => {
    setOptions(opts || {});
    setIsActive(true);
  }, []);

  const triggerFromElement = useCallback((element: HTMLElement, opts?: Partial<ConfettiDisplayProps>) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    setOptions({ ...opts, origin: { x, y } });
    setIsActive(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return (
    <ConfettiContext.Provider value={{ trigger, triggerFromElement }}>
      {children}
      <ConfettiDisplay
        active={isActive}
        onComplete={handleComplete}
        {...options}
      />
    </ConfettiContext.Provider>
  );
}

// Preset confetti bursts
export function useConfettiPresets() {
  const { trigger, triggerFromElement } = useConfetti();

  return {
    // Standard celebration
    celebrate: () => trigger({ pieceCount: 50 }),

    // Big celebration for major achievements
    bigCelebration: () => trigger({ pieceCount: 100, duration: 4000 }),

    // Subtle confetti for small wins
    subtle: () => trigger({ pieceCount: 20, duration: 2000 }),

    // Celebration from a specific element
    celebrateAt: (element: HTMLElement) => triggerFromElement(element, { pieceCount: 30 }),

    // Gold confetti for streaks
    goldCelebration: () => trigger({
      pieceCount: 60,
      colors: ['#FFD700', '#FFA500', '#FBBF24', '#F59E0B', '#D97706'],
    }),

    // Green confetti for completions
    completionCelebration: () => trigger({
      pieceCount: 40,
      colors: ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857'],
    }),
  };
}

// Simple standalone confetti (no context needed)
interface SimpleConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  pieceCount?: number;
}

export function SimpleConfetti({ trigger, onComplete, pieceCount = 30 }: SimpleConfettiProps) {
  return (
    <ConfettiDisplay
      active={trigger}
      onComplete={onComplete}
      pieceCount={pieceCount}
    />
  );
}

// Confetti button that triggers on click
interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ConfettiButton({ children, onClick, className, disabled }: ConfettiButtonProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setShowConfetti(true);
    onClick?.();
  };

  return (
    <>
      <button onClick={handleClick} className={className} disabled={disabled}>
        {children}
      </button>
      <SimpleConfetti
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
        pieceCount={25}
      />
    </>
  );
}

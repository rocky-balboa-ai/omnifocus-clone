'use client';

import { useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  isSwiping: boolean;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 80,
    preventDefault = false,
  } = config;

  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    isSwiping: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      isSwiping: false,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!stateRef.current.startX) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - stateRef.current.startX;
    const deltaY = touch.clientY - stateRef.current.startY;

    // Only allow horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      stateRef.current.isSwiping = true;
      stateRef.current.deltaX = deltaX;

      if (preventDefault) {
        e.preventDefault();
      }
    }
  }, [preventDefault]);

  const handleTouchEnd = useCallback(() => {
    const { deltaX, isSwiping } = stateRef.current;

    if (isSwiping) {
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset state
    stateRef.current = {
      startX: 0,
      startY: 0,
      deltaX: 0,
      isSwiping: false,
    };
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const getSwipeOffset = useCallback(() => {
    return stateRef.current.deltaX;
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    getSwipeOffset,
    isSwiping: () => stateRef.current.isSwiping,
  };
}

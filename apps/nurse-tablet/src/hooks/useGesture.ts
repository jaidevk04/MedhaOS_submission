import { useGesture as useReactGesture } from 'react-use-gesture';
import { useState, useCallback } from 'react';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

export function useGesture(handlers: GestureHandlers) {
  const [isLongPressing, setIsLongPressing] = useState(false);

  const bind = useReactGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      if (swipeX === -1 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      } else if (swipeX === 1 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      }
    },
    onDragStart: () => {
      setIsLongPressing(false);
    },
  });

  const handleTouchStart = useCallback(() => {
    const timeout = setTimeout(() => {
      setIsLongPressing(true);
      if (handlers.onLongPress) {
        handlers.onLongPress();
      }
    }, 500);

    const handleTouchEnd = () => {
      clearTimeout(timeout);
      setIsLongPressing(false);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchend', handleTouchEnd);
  }, [handlers]);

  let lastTap = 0;
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (handlers.onDoubleTap) {
        handlers.onDoubleTap();
      }
    }

    lastTap = now;
  }, [handlers]);

  return {
    bind,
    isLongPressing,
    handleTouchStart,
    handleDoubleTap,
  };
}

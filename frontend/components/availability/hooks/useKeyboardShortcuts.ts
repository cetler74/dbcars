import { useEffect, useRef } from 'react';

interface KeyboardShortcutsHandlers {
  onToday?: () => void;
  onNextMonth?: () => void;
  onPrevMonth?: () => void;
  onFocusSearch?: () => void;
  onCreateNote?: () => void;
  onExport?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutsHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.closest('[contenteditable]') as HTMLElement)?.isContentEditable
      ) {
        // Allow Escape and / even when typing
        if (e.key !== 'Escape' && e.key !== '/') {
          return;
        }
      }

      // Prevent default for shortcuts
      if (
        ['t', 'T', 'n', 'N', 'p', 'P', '/', 'c', 'C', 'e', 'E'].includes(e.key)
      ) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 't':
          handlersRef.current.onToday?.();
          break;
        case 'n':
          handlersRef.current.onNextMonth?.();
          break;
        case 'p':
          handlersRef.current.onPrevMonth?.();
          break;
        case '/':
          handlersRef.current.onFocusSearch?.();
          break;
        case 'c':
          handlersRef.current.onCreateNote?.();
          break;
        case 'e':
          handlersRef.current.onExport?.();
          break;
        case 'Escape':
          handlersRef.current.onEscape?.();
          break;
        case 'ArrowUp':
          handlersRef.current.onArrowUp?.();
          break;
        case 'ArrowDown':
          handlersRef.current.onArrowDown?.();
          break;
        case 'ArrowLeft':
          handlersRef.current.onArrowLeft?.();
          break;
        case 'ArrowRight':
          handlersRef.current.onArrowRight?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

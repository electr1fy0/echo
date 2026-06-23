import { useEffect, useRef } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

const TAGGABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  if (TAGGABLE_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: Record<string, ShortcutHandler>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const handler = handlersRef.current[e.key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

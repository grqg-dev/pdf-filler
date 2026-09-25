import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useAnnotationStore } from "../store/useAnnotationStore";
import type { Tool } from "../types";

const TOOL_KEYS: Record<string, Tool> = {
  v: "select",
  t: "text",
  c: "checkbox",
  s: "image",
  w: "whiteout",
  e: "eraser",
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";
      // Leave typing, and the text box's own undo, to the browser.
      if (isEditing) return;

      const app = useAppStore.getState();
      const annotations = useAnnotationStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        annotations.undo();
        app.selectAnnotation(null);
      } else if ((e.key === "Delete" || e.key === "Backspace") && app.selectedId) {
        e.preventDefault();
        annotations.deleteAnnotation(app.selectedId);
        app.selectAnnotation(null);
      } else if (e.key === "Escape") {
        app.selectAnnotation(null);
      } else if (!mod && !e.altKey && TOOL_KEYS[e.key.toLowerCase()]) {
        app.setTool(TOOL_KEYS[e.key.toLowerCase()]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

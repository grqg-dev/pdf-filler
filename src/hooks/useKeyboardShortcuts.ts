import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useAnnotationStore } from "../store/useAnnotationStore";

export function useKeyboardShortcuts() {
  const selectedId = useAppStore((state) => state.selectedId);
  const selectAnnotation = useAppStore((state) => state.selectAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA";

      if ((e.key === "Delete" || e.key === "Backspace") && !isEditing) {
        if (selectedId) {
          deleteAnnotation(selectedId);
          selectAnnotation(null);
        }
      } else if (e.key === "Escape") {
        if (selectedId) {
          selectAnnotation(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, deleteAnnotation, selectAnnotation]);
}

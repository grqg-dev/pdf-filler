import { Trash2 } from "lucide-react";
import { useCallback } from "react";

interface DeleteButtonProps {
  onDelete: () => void;
}

/** One click deletes; Undo brings it back. Rendered only on the selected item. */
export function DeleteButton({ onDelete }: DeleteButtonProps) {
  const stop = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <button
      type="button"
      onPointerDown={stop}
      onMouseDown={stop}
      onClick={(e) => {
        stop(e);
        onDelete();
      }}
      className="absolute -top-3 -right-3 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label="Delete"
      title="Delete (Del)"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

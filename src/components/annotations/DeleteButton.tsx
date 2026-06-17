import { Trash2, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";

interface DeleteButtonProps {
  onDelete: () => void;
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirming) {
        onDelete();
      } else {
        setConfirming(true);
      }
    },
    [confirming, onDelete]
  );

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`
        absolute -top-3 -right-3 w-6 h-6 rounded-full
        flex items-center justify-center
        shadow-sm border transition-all duration-150 hover:scale-110
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${
          confirming
            ? "opacity-100 scale-110 bg-red-500 text-white border-red-500 hover:bg-red-600"
            : "opacity-0 group-hover:opacity-100 bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
        }
      `}
      aria-label={confirming ? "Click again to delete" : "Delete annotation"}
      title={confirming ? "Click again to delete" : "Delete annotation"}
    >
      {confirming ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

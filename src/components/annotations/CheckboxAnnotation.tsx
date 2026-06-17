import { useCallback, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { CheckboxAnnotation as CheckboxAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { clamp } from "../../utils/geometry";

interface CheckboxAnnotationProps {
  annotation: CheckboxAnnotationType;
  isSelected: boolean;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const DRAG_THRESHOLD = 3;

export const CheckboxAnnotation = function CheckboxAnnotation({
  annotation,
  isSelected,
  pageWidth,
  pageHeight,
  onSelect,
  onMove,
  onToggle,
  onDelete,
}: CheckboxAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    startAnnotationX: number;
    startAnnotationY: number;
    hasMoved: boolean;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startAnnotationX: annotation.x,
        startAnnotationY: annotation.y,
        hasMoved: false,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [annotation.x, annotation.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;

      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;

      if (
        !dragState.current.hasMoved &&
        Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD
      ) {
        dragState.current.hasMoved = true;
      }

      if (dragState.current.hasMoved) {
        const newX = clamp(
          dragState.current.startAnnotationX + dx,
          0,
          pageWidth - annotation.width
        );
        const newY = clamp(
          dragState.current.startAnnotationY + dy,
          0,
          pageHeight - annotation.height
        );
        onMove(annotation.id, newX, newY);
      }
    },
    [annotation, pageWidth, pageHeight, onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;

      const didDrag = dragState.current.hasMoved;
      dragState.current = null;
      setIsDragging(false);

      if (!didDrag) {
        onSelect(annotation.id);
        onToggle(annotation.id);
      }

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [annotation.id, onSelect, onToggle]
  );

  const handleDelete = useCallback(() => {
    onDelete(annotation.id);
  }, [annotation.id, onDelete]);

  return (
    <div
      className={`
        absolute flex items-center justify-center
        ${isDragging ? "cursor-grabbing" : "cursor-pointer"}
      `}
      style={{
        left: annotation.x,
        top: annotation.y,
        width: annotation.width,
        height: annotation.height,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="checkbox"
      aria-checked={annotation.checked}
      aria-label="Checkbox annotation"
    >
      <div
        className={`
          w-full h-full rounded flex items-center justify-center
          transition-colors duration-150
          ${annotation.checked ? "bg-blue-50" : "bg-white"}
        `}
        style={{
          border: isSelected
            ? "2px solid #2563eb"
            : annotation.checked
              ? "2px solid #2563eb"
              : "2px solid #334155",
        }}
      >
        {annotation.checked && (
          <Check
            className="w-full h-full text-blue-600 p-0.5"
            strokeWidth={3}
          />
        )}
      </div>

      {isSelected && !isDragging && <DeleteButton onDelete={handleDelete} />}
    </div>
  );
};

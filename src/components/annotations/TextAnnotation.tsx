import { useCallback, useEffect, useRef, useState } from "react";
import type { TextAnnotation as TextAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { clamp } from "../../utils/geometry";

interface TextAnnotationProps {
  annotation: TextAnnotationType;
  isSelected: boolean;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}

const DRAG_THRESHOLD = 3;

export const TextAnnotation = function TextAnnotation({
  annotation,
  isSelected,
  pageWidth,
  pageHeight,
  onSelect,
  onMove,
  onChange,
  onDelete,
}: TextAnnotationProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    startAnnotationX: number;
    startAnnotationY: number;
    hasMoved: boolean;
  } | null>(null);

  const wasSelectedRef = useRef(false);

  useEffect(() => {
    if (
      contentRef.current &&
      contentRef.current.textContent !== annotation.value
    ) {
      contentRef.current.textContent = annotation.value;
    }
  }, [annotation.value]);

  useEffect(() => {
    if (isSelected && !wasSelectedRef.current) {
      contentRef.current?.focus();
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (document.activeElement === contentRef.current) return;
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
        contentRef.current?.blur();
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
        contentRef.current?.focus();
      }

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [annotation.id, onSelect]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      onChange(annotation.id, e.currentTarget.textContent ?? "");
    },
    [annotation.id, onChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(annotation.id);
  }, [annotation.id, onDelete]);

  return (
    <div
      className={`
        absolute group
        ${isDragging ? "cursor-grabbing" : "cursor-text"}
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
    >
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={`
          w-full h-full px-1.5 py-0.5 outline-none overflow-hidden
          text-left leading-tight transition-colors duration-150
          ${isSelected ? "bg-blue-50/40" : "bg-white/40"}
          hover:bg-blue-50/30
        `}
        style={{
          fontSize: annotation.fontSize,
          color: "#1e293b",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          border: isSelected
            ? "2px solid #2563eb"
            : "1px dashed #cbd5e1",
          borderRadius: "4px",
        }}
      />

      {isSelected && !isDragging && <DeleteButton onDelete={handleDelete} />}
    </div>
  );
};

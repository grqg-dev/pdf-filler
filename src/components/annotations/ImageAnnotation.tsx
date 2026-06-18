import { useCallback, useRef, useState } from "react";
import type { ImageAnnotation as ImageAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { clamp } from "../../utils/geometry";
import { RESIZE_HANDLE_SIZE } from "../../utils/constants";

interface ImageAnnotationProps {
  annotation: ImageAnnotationType;
  isSelected: boolean;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
}

const DRAG_THRESHOLD = 3;
const MIN_SIZE = 20;

export function ImageAnnotation({
  annotation,
  isSelected,
  pageWidth,
  pageHeight,
  onSelect,
  onMove,
  onResize,
  onDelete,
}: ImageAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    startAnnotationX: number;
    startAnnotationY: number;
    hasMoved: boolean;
  } | null>(null);

  const resizeState = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect(annotation.id);

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
    [annotation.x, annotation.y, annotation.id, onSelect]
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

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragState.current = null;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      resizeState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: annotation.width,
        startHeight: annotation.height,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [annotation.width, annotation.height]
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeState.current) return;
      e.stopPropagation();

      const dx = e.clientX - resizeState.current.startX;
      const dy = e.clientY - resizeState.current.startY;

      const newWidth = clamp(
        resizeState.current.startWidth + dx,
        MIN_SIZE,
        pageWidth - annotation.x
      );
      const newHeight = clamp(
        resizeState.current.startHeight + dy,
        MIN_SIZE,
        pageHeight - annotation.y
      );

      onResize(annotation.id, newWidth, newHeight);
    },
    [annotation, pageWidth, pageHeight, onResize]
  );

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    resizeState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleDelete = useCallback(() => {
    onDelete(annotation.id);
  }, [annotation.id, onDelete]);

  return (
    <div
      className={`absolute group ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left: annotation.x,
        top: annotation.y,
        width: annotation.width,
        height: annotation.height,
        outline: isSelected ? "2px solid #2563eb" : "1px dashed #94a3b8",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={annotation.src}
        alt="Signature"
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
      />

      {isSelected && !isDragging && <DeleteButton onDelete={handleDelete} />}

      {isSelected && (
        <div
          style={{
            position: "absolute",
            right: -RESIZE_HANDLE_SIZE / 2,
            bottom: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE + 4,
            height: RESIZE_HANDLE_SIZE + 4,
            background: "#2563eb",
            borderRadius: 2,
            cursor: "se-resize",
          }}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        />
      )}
    </div>
  );
}

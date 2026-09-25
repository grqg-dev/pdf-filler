import { useCallback, useRef, useState } from "react";
import type { Annotation } from "../types";
import { clamp } from "../utils/geometry";
import { MIN_ANNOTATION_HEIGHT, MIN_ANNOTATION_WIDTH } from "../utils/constants";

const DRAG_THRESHOLD_PX = 3;

interface Options {
  annotation: Annotation;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  /** Snapshot for undo; called once when a drag or resize actually starts. */
  onCommit: () => void;
  /** Called on pointer up when the pointer barely moved. */
  onClick?: (e: React.PointerEvent) => void;
}

/**
 * Pointer handlers for moving an annotation by its body and resizing it by a
 * corner handle. Pointer deltas are screen pixels; they're divided by the
 * zoom so geometry stays in page units.
 */
export function useDragResize({
  annotation,
  scale,
  pageWidth,
  pageHeight,
  onMove,
  onResize,
  onCommit,
  onClick,
}: Options) {
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const resize = useRef<{
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  const bodyPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: annotation.x,
        originY: annotation.y,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [annotation.x, annotation.y]
  );

  const bodyPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved) {
        if (Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) return;
        d.moved = true;
        onCommit();
        setIsDragging(true);
      }
      onMove(
        annotation.id,
        clamp(d.originX + dx / scale, 0, Math.max(0, pageWidth - annotation.width)),
        clamp(d.originY + dy / scale, 0, Math.max(0, pageHeight - annotation.height))
      );
    },
    [annotation.id, annotation.width, annotation.height, scale, pageWidth, pageHeight, onMove, onCommit]
  );

  const bodyPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (!d.moved) onClick?.(e);
    },
    [onClick]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      onCommit();
      resize.current = {
        startX: e.clientX,
        startY: e.clientY,
        originW: annotation.width,
        originH: annotation.height,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [annotation.width, annotation.height, onCommit]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const r = resize.current;
      if (!r || !onResize) return;
      e.stopPropagation();
      onResize(
        annotation.id,
        clamp(r.originW + (e.clientX - r.startX) / scale, MIN_ANNOTATION_WIDTH, pageWidth - annotation.x),
        clamp(r.originH + (e.clientY - r.startY) / scale, MIN_ANNOTATION_HEIGHT, pageHeight - annotation.y)
      );
    },
    [annotation.id, annotation.x, annotation.y, scale, pageWidth, pageHeight, onResize]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    resize.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return {
    isDragging,
    bodyHandlers: {
      onPointerDown: bodyPointerDown,
      onPointerMove: bodyPointerMove,
      onPointerUp: bodyPointerUp,
      onPointerCancel: bodyPointerUp,
    },
    resizeHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}

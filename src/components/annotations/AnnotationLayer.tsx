import { useCallback, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { isCoverAnnotation } from "../../store/useAnnotationStore";
import {
  useAnnotationActions,
  useAnnotationsForPage,
} from "../../hooks/useAnnotationActions";
import { TextAnnotation } from "./TextAnnotation";
import { CheckboxAnnotation } from "./CheckboxAnnotation";
import { ImageAnnotation } from "./ImageAnnotation";
import { CoverAnnotation } from "./CoverAnnotation";
import { clamp, getRelativeMousePosition } from "../../utils/geometry";
import type { Annotation, Point } from "../../types";

interface AnnotationLayerProps {
  pageIndex: number;
  /** Page size in page units (viewport at scale 1). */
  pageWidth: number;
  pageHeight: number;
  scale: number;
}

const CURSORS: Record<string, string> = {
  select: "default",
  text: "text",
  checkbox: "crosshair",
  image: "copy",
  whiteout: "crosshair",
};

function eraserCursor(diameterPx: number): string {
  const d = Math.max(6, Math.min(96, Math.round(diameterPx)));
  const r = d / 2;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${d + 2}' height='${d + 2}'><circle cx='${r + 1}' cy='${r + 1}' r='${r}' fill='white' fill-opacity='0.6' stroke='black' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${r + 1} ${r + 1}, crosshair`;
}

export function AnnotationLayer({
  pageIndex,
  pageWidth,
  pageHeight,
  scale,
}: AnnotationLayerProps) {
  const tool = useAppStore((state) => state.tool);
  const selectedId = useAppStore((state) => state.selectedId);
  const eraserSize = useAppStore((state) => state.eraserSize);
  const selectAnnotation = useAppStore((state) => state.selectAnnotation);

  const annotations = useAnnotationsForPage(pageIndex);
  const {
    addTextAnnotation,
    addCheckboxAnnotation,
    addSignatureAnnotation,
    startWhiteout,
    updateWhiteoutDrag,
    finishWhiteout,
    startEraserStroke,
    extendEraserStroke,
  } = useAnnotationActions();

  const gesture = useRef<{ kind: "whiteout" | "eraser"; id: string; start: Point } | null>(null);

  const toPagePoint = useCallback(
    (el: HTMLElement, clientX: number, clientY: number): Point => {
      const pos = getRelativeMousePosition(el, clientX, clientY);
      return {
        x: clamp(pos.x / scale, 0, pageWidth),
        y: clamp(pos.y / scale, 0, pageHeight),
      };
    },
    [scale, pageWidth, pageHeight]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Clicking empty page ends any text editing first.
      (document.activeElement as HTMLElement | null)?.blur?.();

      if (tool === "select") {
        selectAnnotation(null);
        return;
      }

      const pos = toPagePoint(e.currentTarget, e.clientX, e.clientY);
      const place = { pageIndex, x: pos.x, y: pos.y, pageWidth, pageHeight };

      if (tool === "text") {
        addTextAnnotation(place);
      } else if (tool === "checkbox") {
        addCheckboxAnnotation(place);
      } else if (tool === "image") {
        void addSignatureAnnotation(place);
      } else if (tool === "whiteout" || tool === "eraser") {
        selectAnnotation(null);
        const id =
          tool === "whiteout"
            ? startWhiteout(pageIndex, pos)
            : startEraserStroke(pageIndex, pos);
        gesture.current = { kind: tool, id, start: pos };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [
      tool,
      pageIndex,
      pageWidth,
      pageHeight,
      toPagePoint,
      addTextAnnotation,
      addCheckboxAnnotation,
      addSignatureAnnotation,
      startWhiteout,
      startEraserStroke,
      selectAnnotation,
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current;
      if (!g) return;
      const pos = toPagePoint(e.currentTarget, e.clientX, e.clientY);
      if (g.kind === "whiteout") updateWhiteoutDrag(g.id, g.start, pos);
      else extendEraserStroke(g.id, pos);
    },
    [toPagePoint, updateWhiteoutDrag, extendEraserStroke]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current;
      if (!g) return;
      gesture.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (g.kind === "whiteout") finishWhiteout(g.id, pageWidth, pageHeight);
    },
    [finishWhiteout, pageWidth, pageHeight]
  );

  const renderAnnotation = (annotation: Annotation) => {
    const key = annotation.id;
    const common = {
      isSelected: selectedId === annotation.id,
      scale,
      pageWidth,
      pageHeight,
    };

    switch (annotation.type) {
      case "text":
        return <TextAnnotation key={key} {...common} annotation={annotation} />;
      case "checkbox":
        return <CheckboxAnnotation key={key} {...common} annotation={annotation} />;
      case "image":
        return <ImageAnnotation key={key} {...common} annotation={annotation} />;
      case "whiteout":
      case "eraser":
        return (
          <CoverAnnotation
            key={key}
            {...common}
            annotation={annotation}
            interactive={tool === "select"}
          />
        );
    }
  };

  // White-out goes underneath so you can cover old text, then type over it.
  const covers = annotations.filter(isCoverAnnotation);
  const others = annotations.filter((a) => !isCoverAnnotation(a));

  return (
    <div
      className="absolute inset-0"
      style={{
        cursor: tool === "eraser" ? eraserCursor(eraserSize * scale) : CURSORS[tool],
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Stop the browser moving focus to <body> after we focus a new text
      // box. Only for clicks on the bare page, so caret placement inside a
      // text box still works.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      data-page-layer={pageIndex}
    >
      {covers.map(renderAnnotation)}
      {others.map(renderAnnotation)}
    </div>
  );
}

import type {
  EraserAnnotation as EraserAnnotationType,
  WhiteoutAnnotation as WhiteoutAnnotationType,
} from "../../types";
import { DeleteButton } from "./DeleteButton";
import { ResizeHandle } from "./ResizeHandle";
import { useAnnotationActions } from "../../hooks/useAnnotationActions";
import { useDragResize } from "../../hooks/useDragResize";

interface CoverAnnotationProps {
  annotation: WhiteoutAnnotationType | EraserAnnotationType;
  isSelected: boolean;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  /** Only the Select tool can grab white-out; other tools draw through it. */
  interactive: boolean;
}

/**
 * White-out box or eraser stroke. Pure white on the page, like correction
 * tape. A faint outline shows in the editor only (never exported) so the
 * covered area is findable.
 */
export function CoverAnnotation({
  annotation,
  isSelected,
  scale,
  pageWidth,
  pageHeight,
  interactive,
}: CoverAnnotationProps) {
  const { select, moveAnnotation, resizeAnnotation, removeAnnotation, commit } =
    useAnnotationActions();

  const { isDragging, bodyHandlers, resizeHandlers } = useDragResize({
    annotation,
    scale,
    pageWidth,
    pageHeight,
    onMove: moveAnnotation,
    onResize: resizeAnnotation,
    onCommit: commit,
    onClick: () => select(annotation.id),
  });

  const isStroke = annotation.type === "eraser";

  return (
    <div
      {...(interactive ? bodyHandlers : {})}
      onMouseDown={interactive ? (e) => e.preventDefault() : undefined}
      className={`absolute ${interactive ? (isDragging ? "cursor-grabbing" : "cursor-move") : ""}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
        background: isStroke ? "transparent" : "#ffffff",
        outline: isSelected
          ? "2px solid #2563eb"
          : interactive
            ? "1px dashed rgba(100,116,139,0.35)"
            : "none",
        // Strokes are only grabbable on the painted path, not their whole box.
        pointerEvents: interactive && !isStroke ? "auto" : "none",
        touchAction: "none",
      }}
      data-annotation={annotation.type}
    >
      {annotation.type === "eraser" && (
        <svg
          width="100%"
          height="100%"
          viewBox={`${annotation.x} ${annotation.y} ${annotation.width} ${annotation.height}`}
          className="block overflow-visible"
        >
          {annotation.points.length === 1 ? (
            <circle
              cx={annotation.points[0].x}
              cy={annotation.points[0].y}
              r={annotation.strokeWidth / 2}
              fill="#ffffff"
              style={{ pointerEvents: interactive ? "fill" : "none" }}
              {...(interactive ? bodyHandlers : {})}
            />
          ) : (
            <polyline
              points={annotation.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#ffffff"
              strokeWidth={annotation.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: interactive ? "stroke" : "none" }}
              {...(interactive ? bodyHandlers : {})}
            />
          )}
        </svg>
      )}

      {isSelected && !isDragging && (
        <div style={{ pointerEvents: "auto" }}>
          <DeleteButton onDelete={() => removeAnnotation(annotation.id)} />
          {!isStroke && <ResizeHandle handlers={resizeHandlers} />}
        </div>
      )}
    </div>
  );
}

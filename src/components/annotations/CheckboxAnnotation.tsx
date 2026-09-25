import type { CheckboxAnnotation as CheckboxAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { ResizeHandle } from "./ResizeHandle";
import { useAnnotationActions } from "../../hooks/useAnnotationActions";
import { useDragResize } from "../../hooks/useDragResize";
import { CHECK_MARK_POINTS, checkStrokeWidth } from "../../utils/pdfExport";
import { INK_COLOR } from "../../utils/constants";

interface CheckboxAnnotationProps {
  annotation: CheckboxAnnotationType;
  isSelected: boolean;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

export function CheckboxAnnotation({
  annotation,
  isSelected,
  scale,
  pageWidth,
  pageHeight,
}: CheckboxAnnotationProps) {
  const { select, moveAnnotation, resizeAnnotation, toggleCheckbox, removeAnnotation, commit } =
    useAnnotationActions();

  const { isDragging, bodyHandlers, resizeHandlers } = useDragResize({
    annotation,
    scale,
    pageWidth,
    pageHeight,
    onMove: moveAnnotation,
    onResize: resizeAnnotation,
    onCommit: commit,
    onClick: () => {
      select(annotation.id);
      toggleCheckbox(annotation.id);
    },
  });

  const w = annotation.width;
  const h = annotation.height;

  return (
    <div
      {...bodyHandlers}
      onMouseDown={(e) => e.preventDefault()}
      className={`absolute ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: w * scale,
        height: h * scale,
        // The outline is editor-only; only the check mark is exported.
        outline: isSelected
          ? "2px solid #2563eb"
          : annotation.checked
            ? "1px dashed rgba(100,116,139,0.45)"
            : "1px dashed #64748b",
        touchAction: "none",
      }}
      role="checkbox"
      aria-checked={annotation.checked}
      aria-label="Check mark"
      data-annotation="checkbox"
    >
      {annotation.checked && (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          height="100%"
          className="block pointer-events-none"
        >
          <polyline
            points={CHECK_MARK_POINTS.map(([px, py]) => `${px * w},${py * h}`).join(" ")}
            fill="none"
            stroke={INK_COLOR}
            strokeWidth={checkStrokeWidth(w)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {isSelected && !isDragging && (
        <>
          <DeleteButton onDelete={() => removeAnnotation(annotation.id)} />
          <ResizeHandle handlers={resizeHandlers} />
        </>
      )}
    </div>
  );
}

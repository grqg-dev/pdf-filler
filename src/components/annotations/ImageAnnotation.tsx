import type { ImageAnnotation as ImageAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { ResizeHandle } from "./ResizeHandle";
import { useAnnotationActions } from "../../hooks/useAnnotationActions";
import { useDragResize } from "../../hooks/useDragResize";

interface ImageAnnotationProps {
  annotation: ImageAnnotationType;
  isSelected: boolean;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

export function ImageAnnotation({
  annotation,
  isSelected,
  scale,
  pageWidth,
  pageHeight,
}: ImageAnnotationProps) {
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

  return (
    <div
      {...bodyHandlers}
      onPointerDownCapture={() => select(annotation.id)}
      onMouseDown={(e) => e.preventDefault()}
      className={`absolute ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
        outline: isSelected ? "2px solid #2563eb" : "1px dashed rgba(100,116,139,0.45)",
        touchAction: "none",
      }}
      data-annotation="signature"
    >
      <img
        src={annotation.src}
        alt="Signature"
        draggable={false}
        className="block w-full h-full object-contain pointer-events-none select-none"
      />

      {isSelected && !isDragging && (
        <>
          <DeleteButton onDelete={() => removeAnnotation(annotation.id)} />
          <ResizeHandle handlers={resizeHandlers} />
        </>
      )}
    </div>
  );
}

import { forwardRef, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  useAnnotationActions,
  useAnnotationsForPage,
} from "../../hooks/useAnnotationActions";
import { TextAnnotation } from "./TextAnnotation";
import { CheckboxAnnotation } from "./CheckboxAnnotation";
import { ImageAnnotation } from "./ImageAnnotation";
import { getRelativeMousePosition } from "../../utils/geometry";
import type { Annotation } from "../../types";

interface AnnotationLayerProps {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
}

export const AnnotationLayer = forwardRef<HTMLDivElement, AnnotationLayerProps>(
  function AnnotationLayer({ pageIndex, pageWidth, pageHeight }, ref) {
    const tool = useAppStore((state) => state.tool);
    const selectedId = useAppStore((state) => state.selectedId);
    const selectAnnotation = useAppStore((state) => state.selectAnnotation);

    const annotations = useAnnotationsForPage(pageIndex);
    const {
      addTextAnnotation,
      addCheckboxAnnotation,
      addImageAnnotation,
      moveAnnotation,
      resizeAnnotation,
      setTextValue,
      toggleCheckbox,
      removeAnnotation,
      select,
    } = useAnnotationActions();

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (tool === "select") {
          selectAnnotation(null);
          return;
        }

        const container = e.currentTarget;
        const pos = getRelativeMousePosition(container, e.clientX, e.clientY);

        if (tool === "text") {
          addTextAnnotation({
            pageIndex,
            x: pos.x,
            y: pos.y,
            pageWidth,
            pageHeight,
          });
        } else if (tool === "checkbox") {
          addCheckboxAnnotation({
            pageIndex,
            x: pos.x,
            y: pos.y,
            pageWidth,
            pageHeight,
          });
        } else if (tool === "image") {
          addImageAnnotation({
            pageIndex,
            x: pos.x,
            y: pos.y,
            pageWidth,
            pageHeight,
          });
        }
      },
      [
        tool,
        pageIndex,
        pageWidth,
        pageHeight,
        addTextAnnotation,
        addCheckboxAnnotation,
        addImageAnnotation,
        selectAnnotation,
      ]
    );

    const renderAnnotation = (annotation: Annotation) => {
      const isSelected = selectedId === annotation.id;

      if (annotation.type === "text") {
        return (
          <TextAnnotation
            key={annotation.id}
            annotation={annotation}
            isSelected={isSelected}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            onSelect={select}
            onMove={moveAnnotation}
            onChange={setTextValue}
            onDelete={removeAnnotation}
          />
        );
      }

      if (annotation.type === "checkbox") {
        return (
          <CheckboxAnnotation
            key={annotation.id}
            annotation={annotation}
            isSelected={isSelected}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            onSelect={select}
            onMove={moveAnnotation}
            onToggle={toggleCheckbox}
            onDelete={removeAnnotation}
          />
        );
      }

      return (
        <ImageAnnotation
          key={annotation.id}
          annotation={annotation}
          isSelected={isSelected}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          onSelect={select}
          onMove={moveAnnotation}
          onResize={resizeAnnotation}
          onDelete={removeAnnotation}
        />
      );
    };

    return (
      <div
        ref={ref}
        className="absolute inset-0"
        style={{
          width: pageWidth,
          height: pageHeight,
          cursor:
            tool === "text"
              ? "text"
              : tool === "checkbox" || tool === "image"
                ? "crosshair"
                : "default",
        }}
        onPointerDown={handlePointerDown}
      >
        {annotations.map(renderAnnotation)}
      </div>
    );
  }
);

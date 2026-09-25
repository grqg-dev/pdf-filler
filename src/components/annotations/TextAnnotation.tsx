import { useCallback, useEffect, useRef, useState } from "react";
import type { TextAnnotation as TextAnnotationType } from "../../types";
import { DeleteButton } from "./DeleteButton";
import { ResizeHandle } from "./ResizeHandle";
import { useAnnotationActions } from "../../hooks/useAnnotationActions";
import { useDragResize } from "../../hooks/useDragResize";
import {
  INK_COLOR,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT,
  TEXT_PADDING,
} from "../../utils/constants";

interface TextAnnotationProps {
  annotation: TextAnnotationType;
  isSelected: boolean;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

export function TextAnnotation({
  annotation,
  isSelected,
  scale,
  pageWidth,
  pageHeight,
}: TextAnnotationProps) {
  const {
    select,
    moveAnnotation,
    resizeAnnotation,
    setTextValue,
    removeAnnotation,
    discardIfEmpty,
    commit,
  } = useAnnotationActions();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  // One undo step per editing session, taken on the first keystroke.
  const typedThisSession = useRef(false);

  const focusEditor = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    el.focus();
    // Put the caret at the end of existing text.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  // Keep the DOM in sync with the store (undo, programmatic edits) without
  // resetting the caret while the user types.
  useEffect(() => {
    const el = contentRef.current;
    if (el && el.textContent !== annotation.value) {
      el.textContent = annotation.value;
    }
  }, [annotation.value]);

  // A freshly placed box starts in editing mode.
  const wasSelected = useRef(false);
  useEffect(() => {
    if (isSelected && !wasSelected.current && annotation.value === "") {
      focusEditor();
    }
    wasSelected.current = isSelected;
  }, [isSelected, annotation.value, focusEditor]);

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
      focusEditor();
    },
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditing) {
        // Let the browser place the caret; don't start a drag or let the
        // page layer create another box underneath.
        e.stopPropagation();
        return;
      }
      bodyHandlers.onPointerDown(e);
    },
    [isEditing, bodyHandlers]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (!typedThisSession.current) {
        typedThisSession.current = true;
        commit();
      }
      // plaintext-only editing can still leave a trailing <br>; normalise.
      const value = (e.currentTarget.innerText ?? "").replace(/\n$/, "");
      setTextValue(annotation.id, value, pageHeight);
    },
    [annotation.id, commit, setTextValue, pageHeight]
  );

  const fontPx = annotation.fontSize * scale;

  return (
    <div
      className={`absolute group ${isEditing ? "cursor-text" : isDragging ? "cursor-grabbing" : "cursor-move"}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
        outline: isSelected
          ? "2px solid #2563eb"
          : annotation.value
            ? "1px dashed rgba(100,116,139,0.45)"
            : "1px dashed #64748b",
        outlineOffset: 1,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={bodyHandlers.onPointerMove}
      onPointerUp={bodyHandlers.onPointerUp}
      onPointerCancel={bodyHandlers.onPointerCancel}
      data-annotation="text"
    >
      <div
        ref={contentRef}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Text box"
        spellCheck={false}
        onInput={handleInput}
        onFocus={() => {
          setIsEditing(true);
          typedThisSession.current = false;
          select(annotation.id);
        }}
        onBlur={() => {
          setIsEditing(false);
          discardIfEmpty(annotation.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            contentRef.current?.blur();
          }
        }}
        className="w-full h-full outline-none"
        style={{
          fontFamily: TEXT_FONT_FAMILY,
          fontSize: fontPx,
          lineHeight: TEXT_LINE_HEIGHT,
          padding: TEXT_PADDING * scale,
          color: INK_COLOR,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          overflow: "visible",
          pointerEvents: isEditing ? "auto" : "none",
          userSelect: isEditing ? "text" : "none",
        }}
      />

      {!annotation.value && !isEditing && (
        <span
          className="absolute inset-0 flex items-center text-slate-400 pointer-events-none"
          style={{ fontSize: fontPx, paddingLeft: TEXT_PADDING * scale }}
        >
          Type here
        </span>
      )}

      {isSelected && !isDragging && (
        <>
          <DeleteButton onDelete={() => removeAnnotation(annotation.id)} />
          <ResizeHandle handlers={resizeHandlers} cursor="ew-resize" />
        </>
      )}
    </div>
  );
}

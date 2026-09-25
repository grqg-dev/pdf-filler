import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import {
  useAnnotationStore,
  isTextAnnotation,
  isCheckboxAnnotation,
} from "../store/useAnnotationStore";
import { useAppStore } from "../store/useAppStore";
import {
  DEFAULT_TEXT_ANNOTATION,
  DEFAULT_CHECKBOX_ANNOTATION,
  DEFAULT_SIGNATURE_WIDTH,
  MIN_ANNOTATION_WIDTH,
  MIN_ANNOTATION_HEIGHT,
  TEXT_PADDING,
} from "../utils/constants";
import { clamp, constrainRectToBounds } from "../utils/geometry";
import { measureTextBoxHeight } from "../utils/textLayout";
import { loadSignature } from "../utils/signature";
import type {
  Annotation,
  TextAnnotation,
  CheckboxAnnotation,
  ImageAnnotation,
  WhiteoutAnnotation,
  EraserAnnotation,
  Point,
} from "../types";

/** Positions and page sizes are in page units (see types/index.ts). */
interface PlaceOptions {
  pageIndex: number;
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
}

export function useAnnotationActions() {
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const commit = useAnnotationStore((state) => state.commit);
  const selectAnnotation = useAppStore((state) => state.selectAnnotation);
  const setNotice = useAppStore((state) => state.setNotice);
  const textFontSize = useAppStore((state) => state.textFontSize);
  const eraserSize = useAppStore((state) => state.eraserSize);

  const addTextAnnotation = useCallback(
    ({ pageIndex, x, y, pageWidth, pageHeight }: PlaceOptions) => {
      const height = measureTextBoxHeight("", textFontSize, DEFAULT_TEXT_ANNOTATION.width);
      // Put the first line's baseline area where the user clicked.
      const rect = constrainRectToBounds(
        {
          x: x - TEXT_PADDING,
          y: y - height / 2,
          width: DEFAULT_TEXT_ANNOTATION.width,
          height,
        },
        pageWidth,
        pageHeight,
        MIN_ANNOTATION_WIDTH,
        MIN_ANNOTATION_HEIGHT
      );

      const annotation: TextAnnotation = {
        id: uuid(),
        type: "text",
        pageIndex,
        ...rect,
        value: "",
        fontSize: textFontSize,
      };

      addAnnotation(annotation);
      selectAnnotation(annotation.id);
      return annotation.id;
    },
    [addAnnotation, selectAnnotation, textFontSize]
  );

  const addCheckboxAnnotation = useCallback(
    ({ pageIndex, x, y, pageWidth, pageHeight }: PlaceOptions) => {
      const rect = constrainRectToBounds(
        {
          x: x - DEFAULT_CHECKBOX_ANNOTATION.width / 2,
          y: y - DEFAULT_CHECKBOX_ANNOTATION.height / 2,
          width: DEFAULT_CHECKBOX_ANNOTATION.width,
          height: DEFAULT_CHECKBOX_ANNOTATION.height,
        },
        pageWidth,
        pageHeight,
        MIN_ANNOTATION_WIDTH,
        MIN_ANNOTATION_HEIGHT
      );

      // Placing a check means "check this", so it starts checked.
      const annotation: CheckboxAnnotation = {
        id: uuid(),
        type: "checkbox",
        pageIndex,
        ...rect,
        checked: true,
      };

      addAnnotation(annotation);
      selectAnnotation(annotation.id);
      return annotation.id;
    },
    [addAnnotation, selectAnnotation]
  );

  const addSignatureAnnotation = useCallback(
    async ({ pageIndex, x, y, pageWidth, pageHeight }: PlaceOptions) => {
      let signature;
      try {
        signature = await loadSignature();
      } catch (err) {
        console.error("Signature load failed", err);
        setNotice("Couldn't load Dr. Ray's signature. Check your connection and try again.");
        return null;
      }

      const width = DEFAULT_SIGNATURE_WIDTH;
      const height = width / signature.aspect;
      const rect = constrainRectToBounds(
        { x: x - width / 2, y: y - height / 2, width, height },
        pageWidth,
        pageHeight,
        MIN_ANNOTATION_WIDTH,
        MIN_ANNOTATION_HEIGHT
      );

      const annotation: ImageAnnotation = {
        id: uuid(),
        type: "image",
        pageIndex,
        ...rect,
        src: signature.src,
      };

      addAnnotation(annotation);
      selectAnnotation(annotation.id);
      return annotation.id;
    },
    [addAnnotation, selectAnnotation, setNotice]
  );

  const startWhiteout = useCallback(
    (pageIndex: number, start: Point) => {
      const annotation: WhiteoutAnnotation = {
        id: uuid(),
        type: "whiteout",
        pageIndex,
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
      };
      addAnnotation(annotation);
      return annotation.id;
    },
    [addAnnotation]
  );

  const updateWhiteoutDrag = useCallback(
    (id: string, start: Point, current: Point) => {
      updateAnnotation(id, (a) => ({
        ...a,
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y),
      }));
    },
    [updateAnnotation]
  );

  /** A plain click (no drag) with the white-out tool leaves a small default box. */
  const finishWhiteout = useCallback(
    (id: string, pageWidth: number, pageHeight: number) => {
      updateAnnotation(id, (a) => {
        if (a.width >= 4 && a.height >= 4) return a;
        return {
          ...a,
          ...constrainRectToBounds(
            { x: a.x - 40, y: a.y - 8, width: 80, height: 16 },
            pageWidth,
            pageHeight,
            MIN_ANNOTATION_WIDTH,
            MIN_ANNOTATION_HEIGHT
          ),
        };
      });
      selectAnnotation(id);
    },
    [updateAnnotation, selectAnnotation]
  );

  const startEraserStroke = useCallback(
    (pageIndex: number, start: Point) => {
      const r = eraserSize / 2;
      const annotation: EraserAnnotation = {
        id: uuid(),
        type: "eraser",
        pageIndex,
        x: start.x - r,
        y: start.y - r,
        width: eraserSize,
        height: eraserSize,
        points: [start],
        strokeWidth: eraserSize,
      };
      addAnnotation(annotation);
      return annotation.id;
    },
    [addAnnotation, eraserSize]
  );

  const extendEraserStroke = useCallback(
    (id: string, point: Point) => {
      updateAnnotation(id, (a) => {
        if (a.type !== "eraser") return a;
        const points = [...a.points, point];
        const r = a.strokeWidth / 2;
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs) - r;
        const minY = Math.min(...ys) - r;
        return {
          ...a,
          points,
          x: minX,
          y: minY,
          width: Math.max(...xs) + r - minX,
          height: Math.max(...ys) + r - minY,
        };
      });
    },
    [updateAnnotation]
  );

  const moveAnnotation = useCallback(
    (id: string, x: number, y: number) => {
      updateAnnotation(id, (annotation) => {
        if (annotation.type !== "eraser") return { ...annotation, x, y };
        // Strokes carry their points along with the bounding box.
        const dx = x - annotation.x;
        const dy = y - annotation.y;
        return {
          ...annotation,
          x,
          y,
          points: annotation.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      });
    },
    [updateAnnotation]
  );

  const resizeAnnotation = useCallback(
    (id: string, width: number, height: number) => {
      updateAnnotation(id, (annotation) => {
        if (isTextAnnotation(annotation)) {
          // Text boxes grow to fit their content; the user only sets width.
          const needed = measureTextBoxHeight(annotation.value, annotation.fontSize, width);
          return { ...annotation, width, height: Math.max(needed, height) };
        }
        if (annotation.type === "image") {
          // Keep the signature's proportions.
          const aspect = annotation.width / annotation.height;
          return { ...annotation, width, height: width / aspect };
        }
        if (annotation.type === "checkbox") {
          const size = Math.max(width, height);
          return { ...annotation, width: size, height: size };
        }
        return { ...annotation, width, height };
      });
    },
    [updateAnnotation]
  );

  const setTextValue = useCallback(
    (id: string, value: string, pageHeight: number) => {
      updateAnnotation(id, (annotation) => {
        if (!isTextAnnotation(annotation)) return annotation;
        const height = measureTextBoxHeight(value, annotation.fontSize, annotation.width);
        return {
          ...annotation,
          value,
          height,
          y: clamp(annotation.y, 0, Math.max(0, pageHeight - height)),
        };
      });
    },
    [updateAnnotation]
  );

  const setTextFontSizeFor = useCallback(
    (id: string, fontSize: number) => {
      commit();
      updateAnnotation(id, (annotation) => {
        if (!isTextAnnotation(annotation)) return annotation;
        return {
          ...annotation,
          fontSize,
          height: measureTextBoxHeight(annotation.value, fontSize, annotation.width),
        };
      });
    },
    [commit, updateAnnotation]
  );

  const toggleCheckbox = useCallback(
    (id: string) => {
      commit();
      updateAnnotation(id, (annotation) => {
        if (!isCheckboxAnnotation(annotation)) return annotation;
        return { ...annotation, checked: !annotation.checked };
      });
    },
    [commit, updateAnnotation]
  );

  const removeAnnotation = useCallback(
    (id: string) => {
      deleteAnnotation(id);
      selectAnnotation(null);
    },
    [deleteAnnotation, selectAnnotation]
  );

  /** Drop a text box the user left empty, without leaving an undo step. */
  const discardIfEmpty = useCallback((id: string) => {
    const store = useAnnotationStore.getState();
    const annotation = store.getAnnotationById(id);
    if (!annotation || !isTextAnnotation(annotation) || annotation.value.trim()) return;
    // Also drop the history entries this box created (its creation and any
    // typing that was later cleared), so undo doesn't land on a no-op.
    const past = [...store.past];
    const has = (snap: Record<number, Annotation[]>) =>
      Object.values(snap).some((list) => list.some((a) => a.id === id));
    while (past.length > 0 && has(past[past.length - 1])) past.pop();
    if (past.length > 0) past.pop();
    store.deleteAnnotation(id);
    useAnnotationStore.setState({ past });
    if (useAppStore.getState().selectedId === id) selectAnnotation(null);
  }, [selectAnnotation]);

  const select = useCallback(
    (id: string | null) => {
      selectAnnotation(id);
    },
    [selectAnnotation]
  );

  return {
    addTextAnnotation,
    addCheckboxAnnotation,
    addSignatureAnnotation,
    startWhiteout,
    updateWhiteoutDrag,
    finishWhiteout,
    startEraserStroke,
    extendEraserStroke,
    moveAnnotation,
    resizeAnnotation,
    setTextValue,
    setTextFontSizeFor,
    toggleCheckbox,
    removeAnnotation,
    discardIfEmpty,
    commit,
    select,
  };
}

const EMPTY_ANNOTATIONS: Annotation[] = [];

export function useAnnotationsForPage(pageIndex: number): Annotation[] {
  return useAnnotationStore(
    (state) => state.annotationsByPage[pageIndex] ?? EMPTY_ANNOTATIONS
  );
}

export function useAnnotationById(id: string | null): Annotation | undefined {
  return useAnnotationStore((state) => {
    if (!id) return undefined;
    for (const annotations of Object.values(state.annotationsByPage)) {
      const found = annotations.find((a) => a.id === id);
      if (found) return found;
    }
    return undefined;
  });
}

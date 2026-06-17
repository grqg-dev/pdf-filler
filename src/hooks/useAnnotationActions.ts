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
  MIN_ANNOTATION_WIDTH,
  MIN_ANNOTATION_HEIGHT,
} from "../utils/constants";
import { constrainRectToBounds } from "../utils/geometry";
import type { Annotation, TextAnnotation, CheckboxAnnotation } from "../types";

interface AddTextOptions {
  pageIndex: number;
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
}

interface AddCheckboxOptions {
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
  const selectAnnotation = useAppStore((state) => state.selectAnnotation);

  const textFontSize = useAppStore((state) => state.textFontSize);

  const addTextAnnotation = useCallback(
    ({ pageIndex, x, y, pageWidth, pageHeight }: AddTextOptions) => {
      const rect = constrainRectToBounds(
        {
          x: x - DEFAULT_TEXT_ANNOTATION.width / 2,
          y: y - DEFAULT_TEXT_ANNOTATION.height / 2,
          width: DEFAULT_TEXT_ANNOTATION.width,
          height: DEFAULT_TEXT_ANNOTATION.height,
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
    ({ pageIndex, x, y, pageWidth, pageHeight }: AddCheckboxOptions) => {
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

      const annotation: CheckboxAnnotation = {
        id: uuid(),
        type: "checkbox",
        pageIndex,
        ...rect,
        checked: false,
      };

      addAnnotation(annotation);
      selectAnnotation(annotation.id);
      return annotation.id;
    },
    [addAnnotation, selectAnnotation]
  );

  const moveAnnotation = useCallback(
    (id: string, x: number, y: number) => {
      updateAnnotation(id, (annotation) => ({
        ...annotation,
        x,
        y,
      }));
    },
    [updateAnnotation]
  );

  const resizeAnnotation = useCallback(
    (id: string, width: number, height: number) => {
      updateAnnotation(id, (annotation) => ({
        ...annotation,
        width,
        height,
      }));
    },
    [updateAnnotation]
  );

  const setTextValue = useCallback(
    (id: string, value: string) => {
      updateAnnotation(id, (annotation) => {
        if (!isTextAnnotation(annotation)) return annotation;
        return { ...annotation, value };
      });
    },
    [updateAnnotation]
  );

  const toggleCheckbox = useCallback(
    (id: string) => {
      updateAnnotation(id, (annotation) => {
        if (!isCheckboxAnnotation(annotation)) return annotation;
        return { ...annotation, checked: !annotation.checked };
      });
    },
    [updateAnnotation]
  );

  const removeAnnotation = useCallback(
    (id: string) => {
      deleteAnnotation(id);
      selectAnnotation(null);
    },
    [deleteAnnotation, selectAnnotation]
  );

  const updateTextAnnotation = useCallback(
    (id: string, updates: Partial<Omit<TextAnnotation, "id" | "type">>) => {
      updateAnnotation(id, (annotation) => {
        if (!isTextAnnotation(annotation)) return annotation;
        return { ...annotation, ...updates };
      });
    },
    [updateAnnotation]
  );

  const updateCheckboxAnnotation = useCallback(
    (
      id: string,
      updates: Partial<Omit<CheckboxAnnotation, "id" | "type">>
    ) => {
      updateAnnotation(id, (annotation) => {
        if (!isCheckboxAnnotation(annotation)) return annotation;
        return { ...annotation, ...updates };
      });
    },
    [updateAnnotation]
  );

  const select = useCallback(
    (id: string | null) => {
      selectAnnotation(id);
    },
    [selectAnnotation]
  );

  return {
    addTextAnnotation,
    addCheckboxAnnotation,
    moveAnnotation,
    resizeAnnotation,
    setTextValue,
    toggleCheckbox,
    removeAnnotation,
    updateTextAnnotation,
    updateCheckboxAnnotation,
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

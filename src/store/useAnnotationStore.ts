import { create } from "zustand";
import type { Annotation, TextAnnotation, CheckboxAnnotation, ImageAnnotation } from "../types";

interface AnnotationState {
  annotationsByPage: Record<number, Annotation[]>;

  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (
    id: string,
    updater: (annotation: Annotation) => Annotation
  ) => void;
  deleteAnnotation: (id: string) => void;
  deleteAnnotationsForPage: (pageIndex: number) => void;
  getAnnotationsForPage: (pageIndex: number) => Annotation[];
  getAnnotationById: (id: string) => Annotation | undefined;
  reset: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotationsByPage: {},

  addAnnotation: (annotation) => {
    set((state) => ({
      annotationsByPage: {
        ...state.annotationsByPage,
        [annotation.pageIndex]: [
          ...(state.annotationsByPage[annotation.pageIndex] ?? []),
          annotation,
        ],
      },
    }));
  },

  updateAnnotation: (id, updater) => {
    set((state) => {
      const next: Record<number, Annotation[]> = {};

      for (const [pageIndex, annotations] of Object.entries(
        state.annotationsByPage
      )) {
        next[Number(pageIndex)] = annotations.map((annotation) =>
          annotation.id === id ? updater(annotation) : annotation
        );
      }

      return { annotationsByPage: next };
    });
  },

  deleteAnnotation: (id) => {
    set((state) => {
      const next: Record<number, Annotation[]> = {};

      for (const [pageIndex, annotations] of Object.entries(
        state.annotationsByPage
      )) {
        const filtered = annotations.filter(
          (annotation) => annotation.id !== id
        );
        if (filtered.length > 0) {
          next[Number(pageIndex)] = filtered;
        }
      }

      return { annotationsByPage: next };
    });
  },

  deleteAnnotationsForPage: (pageIndex) => {
    set((state) => {
      const next = { ...state.annotationsByPage };
      delete next[pageIndex];
      return { annotationsByPage: next };
    });
  },

  getAnnotationsForPage: (pageIndex) => {
    return get().annotationsByPage[pageIndex] ?? [];
  },

  getAnnotationById: (id) => {
    for (const annotations of Object.values(get().annotationsByPage)) {
      const found = annotations.find((annotation) => annotation.id === id);
      if (found) return found;
    }
    return undefined;
  },

  reset: () => set({ annotationsByPage: {} }),
}));

export function isTextAnnotation(
  annotation: Annotation
): annotation is TextAnnotation {
  return annotation.type === "text";
}

export function isCheckboxAnnotation(
  annotation: Annotation
): annotation is CheckboxAnnotation {
  return annotation.type === "checkbox";
}

export function isImageAnnotation(
  annotation: Annotation
): annotation is ImageAnnotation {
  return annotation.type === "image";
}

import { create } from "zustand";
import type { Annotation, TextAnnotation, CheckboxAnnotation, ImageAnnotation } from "../types";

type AnnotationMap = Record<number, Annotation[]>;

const MAX_HISTORY = 100;

interface AnnotationState {
  annotationsByPage: AnnotationMap;
  past: AnnotationMap[];

  /** Snapshot the current state so the next change can be undone. */
  commit: () => void;
  undo: () => void;

  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (
    id: string,
    updater: (annotation: Annotation) => Annotation
  ) => void;
  deleteAnnotation: (id: string) => void;
  getAnnotationById: (id: string) => Annotation | undefined;
  reset: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotationsByPage: {},
  past: [],

  commit: () => {
    set((state) => ({
      past: [...state.past, state.annotationsByPage].slice(-MAX_HISTORY),
    }));
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      return {
        annotationsByPage: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
      };
    });
  },

  addAnnotation: (annotation) => {
    get().commit();
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

  // Does not snapshot on its own: callers commit() once at the start of a
  // gesture (drag, resize, typing session) so undo steps are meaningful.
  updateAnnotation: (id, updater) => {
    set((state) => {
      const next: AnnotationMap = {};

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
    if (!get().getAnnotationById(id)) return;
    get().commit();
    set((state) => {
      const next: AnnotationMap = {};

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

  getAnnotationById: (id) => {
    for (const annotations of Object.values(get().annotationsByPage)) {
      const found = annotations.find((annotation) => annotation.id === id);
      if (found) return found;
    }
    return undefined;
  },

  reset: () => set({ annotationsByPage: {}, past: [] }),
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

/** White-out marks render beneath everything else, so you can erase then type over. */
export function isCoverAnnotation(annotation: Annotation): boolean {
  return annotation.type === "whiteout" || annotation.type === "eraser";
}

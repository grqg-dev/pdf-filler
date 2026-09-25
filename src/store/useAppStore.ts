import { create } from "zustand";
import type { Tool } from "../types";
import {
  DEFAULT_SCALE,
  DEFAULT_TEXT_ANNOTATION,
  DEFAULT_ERASER_SIZE,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
} from "../utils/constants";

interface AppState {
  tool: Tool;
  scale: number;
  /** Font size in points for new text boxes. */
  textFontSize: number;
  /** Eraser brush diameter in points. */
  eraserSize: number;
  pdfSource: File | string | null;
  selectedId: string | null;
  isExporting: boolean;
  /** Short-lived message shown to the user (errors, hints). */
  notice: string | null;

  setTool: (tool: Tool) => void;
  setScale: (scale: number) => void;
  setTextFontSize: (size: number) => void;
  setEraserSize: (size: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPdfSource: (source: File | string | null) => void;
  selectAnnotation: (id: string | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  setNotice: (notice: string | null) => void;
  reset: () => void;
}

const initialState = {
  tool: "select" as Tool,
  scale: DEFAULT_SCALE,
  textFontSize: DEFAULT_TEXT_ANNOTATION.fontSize,
  eraserSize: DEFAULT_ERASER_SIZE,
  pdfSource: null as File | string | null,
  selectedId: null as string | null,
  isExporting: false,
  notice: null as string | null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool, selectedId: null }),

  setScale: (scale) => set({ scale }),

  setTextFontSize: (textFontSize) => set({ textFontSize }),

  setEraserSize: (eraserSize) => set({ eraserSize }),

  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(scale + SCALE_STEP, MAX_SCALE) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(scale - SCALE_STEP, MIN_SCALE) });
  },

  setPdfSource: (pdfSource) => set({ pdfSource }),

  selectAnnotation: (id) => set({ selectedId: id }),

  setIsExporting: (isExporting) => set({ isExporting }),

  setNotice: (notice) => set({ notice }),

  reset: () => set(initialState),
}));

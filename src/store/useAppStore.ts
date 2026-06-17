import { create } from "zustand";
import type { Tool } from "../types";

interface AppState {
  tool: Tool;
  scale: number;
  textFontSize: number;
  pdfSource: File | string | null;
  selectedId: string | null;
  isExporting: boolean;

  setTool: (tool: Tool) => void;
  setScale: (scale: number) => void;
  setTextFontSize: (size: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPdfSource: (source: File | string | null) => void;
  selectAnnotation: (id: string | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  reset: () => void;
}

const initialState = {
  tool: "select" as Tool,
  scale: 1.5,
  textFontSize: 16,
  pdfSource: null as File | string | null,
  selectedId: null as string | null,
  isExporting: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool }),

  setScale: (scale) => set({ scale }),

  setTextFontSize: (textFontSize) => set({ textFontSize }),

  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(scale + 0.25, 3) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(scale - 0.25, 0.5) });
  },

  setPdfSource: (pdfSource) => set({ pdfSource }),

  selectAnnotation: (id) => set({ selectedId: id }),

  setIsExporting: (isExporting) => set({ isExporting }),

  reset: () => set(initialState),
}));

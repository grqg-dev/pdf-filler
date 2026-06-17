import { create } from "zustand";
import type { Tool } from "../types";

interface AppState {
  tool: Tool;
  scale: number;
  textFontSize: number;
  pdfFile: File | null;
  selectedId: string | null;
  isExporting: boolean;

  setTool: (tool: Tool) => void;
  setScale: (scale: number) => void;
  setTextFontSize: (size: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPdfFile: (file: File | null) => void;
  selectAnnotation: (id: string | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  reset: () => void;
}

const initialState = {
  tool: "select" as Tool,
  scale: 1.5,
  textFontSize: 16,
  pdfFile: null as File | null,
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

  setPdfFile: (pdfFile) => set({ pdfFile }),

  selectAnnotation: (id) => set({ selectedId: id }),

  setIsExporting: (isExporting) => set({ isExporting }),

  reset: () => set(initialState),
}));

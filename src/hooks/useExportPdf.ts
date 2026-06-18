import { useCallback, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { exportToPdf, exportToBlob, type ExportPageData } from "../utils/pdfExport";

export interface ExportPageRef {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  overlayElement: HTMLElement;
  widthPts: number;
  heightPts: number;
}

interface UseExportPdfResult {
  exportPdf: () => Promise<void>;
  exportBlob: () => Promise<Blob>;
  isExporting: boolean;
  exportError: Error | null;
  registerPageRef: (pageIndex: number, ref: ExportPageRef | null) => void;
}

export function useExportPdf(): UseExportPdfResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const pdfSource = useAppStore((state) => state.pdfSource);
  const setIsExportingGlobal = useAppStore((state) => state.setIsExporting);

  const pageRefs = useRef<Map<number, ExportPageRef>>(new Map());

  const registerPageRef = useCallback(
    (pageIndex: number, ref: ExportPageRef | null) => {
      if (ref) {
        pageRefs.current.set(pageIndex, ref);
      } else {
        pageRefs.current.delete(pageIndex);
      }
    },
    []
  );

  const exportPdf = useCallback(async () => {
    if (!pdfSource) return;

    setIsExporting(true);
    setExportError(null);
    setIsExportingGlobal(true);

    try {
      const pages: ExportPageData[] = [];
      const sortedIndexes = Array.from(pageRefs.current.keys()).sort(
        (a, b) => a - b
      );

      for (const pageIndex of sortedIndexes) {
        const ref = pageRefs.current.get(pageIndex);
        if (ref) {
          pages.push(ref);
        }
      }

      if (pages.length === 0) {
        throw new Error("No pages available to export");
      }

      const rawName =
        typeof pdfSource === "string"
          ? (pdfSource.split("/").pop()?.split("?")[0] ?? "document.pdf")
          : pdfSource.name;
      const baseName = rawName.replace(/\.pdf$/i, "") || "filled";
      await exportToPdf(pages, `${baseName}-filled.pdf`);
    } catch (err) {
      setExportError(
        err instanceof Error ? err : new Error("Export failed")
      );
    } finally {
      setIsExporting(false);
      setIsExportingGlobal(false);
    }
  }, [pdfSource, setIsExportingGlobal]);

  const exportBlob = useCallback(async (): Promise<Blob> => {
    const pages: ExportPageData[] = [];
    const sortedIndexes = Array.from(pageRefs.current.keys()).sort((a, b) => a - b);
    for (const pageIndex of sortedIndexes) {
      const ref = pageRefs.current.get(pageIndex);
      if (ref) pages.push(ref);
    }
    if (pages.length === 0) throw new Error("No pages available to export");
    return exportToBlob(pages);
  }, []);

  return { exportPdf, exportBlob, isExporting, exportError, registerPageRef };
}

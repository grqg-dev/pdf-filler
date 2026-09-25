import { useCallback, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useAppStore } from "../store/useAppStore";
import { useAnnotationStore } from "../store/useAnnotationStore";
import { exportToBlob, exportToFile } from "../utils/pdfExport";

interface UseExportPdfResult {
  exportPdf: () => Promise<void>;
  exportBlob: () => Promise<Blob>;
  isExporting: boolean;
  exportError: string | null;
  clearExportError: () => void;
}

export function useExportPdf(
  doc: PDFDocumentProxy | null,
  baseName: string
): UseExportPdfResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const setIsExportingGlobal = useAppStore((state) => state.setIsExporting);

  const exportBlob = useCallback(async (): Promise<Blob> => {
    if (!doc) throw new Error("The PDF has not finished loading");
    // Commit any in-progress edit and clear selection before snapshotting.
    (document.activeElement as HTMLElement | null)?.blur();
    useAppStore.getState().selectAnnotation(null);
    return exportToBlob(doc, useAnnotationStore.getState().annotationsByPage);
  }, [doc]);

  const exportPdf = useCallback(async () => {
    if (!doc) return;

    setIsExporting(true);
    setExportError(null);
    setIsExportingGlobal(true);

    try {
      (document.activeElement as HTMLElement | null)?.blur();
      useAppStore.getState().selectAnnotation(null);
      await exportToFile(
        doc,
        useAnnotationStore.getState().annotationsByPage,
        `${baseName}-edited.pdf`
      );
    } catch (err) {
      console.error("Export failed", err);
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
      setIsExportingGlobal(false);
    }
  }, [doc, baseName, setIsExportingGlobal]);

  const clearExportError = useCallback(() => setExportError(null), []);

  return { exportPdf, exportBlob, isExporting, exportError, clearExportError };
}

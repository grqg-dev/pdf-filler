/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface UsePdfDocumentResult {
  doc: PDFDocumentProxy | null;
  numPages: number;
  isLoading: boolean;
  error: Error | null;
}

export function usePdfDocument(file: File): UsePdfDocumentResult {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const loadingTask = pdfjs.getDocument({ url });

    setIsLoading(true);
    setError(null);

    loadingTask.promise
      .then((loadedDoc) => {
        URL.revokeObjectURL(url);
        if (cancelled) {
          (loadedDoc as unknown as { destroy: () => void }).destroy();
          return;
        }
        setDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        URL.revokeObjectURL(url);
        if (cancelled) return;
        setError(
          err instanceof Error ? err : new Error("Failed to load PDF")
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [file]);

  return { doc, numPages, isLoading, error };
}

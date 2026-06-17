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

export function usePdfDocument(source: File | string): UsePdfDocumentResult {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const url =
      typeof source === "string"
        ? source
        : (objectUrl = URL.createObjectURL(source));

    const loadingTask = pdfjs.getDocument({ url });

    setIsLoading(true);
    setError(null);

    loadingTask.promise
      .then((loadedDoc) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (cancelled) {
          (loadedDoc as unknown as { destroy: () => void }).destroy();
          return;
        }
        setDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
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
  }, [source]);

  return { doc, numPages, isLoading, error };
}

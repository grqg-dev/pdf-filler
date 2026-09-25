import { useEffect, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PageCanvas } from "./PageCanvas";
import { AnnotationLayer } from "../annotations/AnnotationLayer";
import { PageErrorBoundary } from "./PageErrorBoundary";

interface PageRendererProps {
  doc: PDFDocumentProxy;
  pageIndex: number;
  scale: number;
}

export function PageRenderer({
  doc,
  pageIndex,
  scale,
}: PageRendererProps) {
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    doc
      .getPage(pageIndex + 1)
      .then((loadedPage) => {
        if (cancelled) {
          loadedPage.cleanup();
          return;
        }
        setPage(loadedPage);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load page"));
      });

    return () => {
      cancelled = true;
      setPage((current) => {
        if (current) {
          current.cleanup();
        }
        return null;
      });
    };
  }, [doc, pageIndex]);

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg m-4">
        <p className="text-red-600 font-medium">
          Failed to load page {pageIndex + 1}
        </p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-96 bg-white shadow-sm">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const viewport = page.getViewport({ scale });
  const pageSize = page.getViewport({ scale: 1 });

  return (
    <PageErrorBoundary pageIndex={pageIndex}>
      <div className="flex flex-col items-center">
        <div
          className="relative bg-white shadow-lg rounded-sm"
          style={{
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
          }}
        >
          <PageCanvas page={page} scale={scale} />
          <AnnotationLayer
            pageIndex={pageIndex}
            pageWidth={pageSize.width}
            pageHeight={pageSize.height}
            scale={scale}
          />
        </div>
        <span className="mt-2 text-xs font-medium text-slate-400">
          Page {pageIndex + 1}
        </span>
      </div>
    </PageErrorBoundary>
  );
}

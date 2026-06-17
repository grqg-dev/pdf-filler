import { useRef } from "react";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import { useAppStore } from "../../store/useAppStore";
import { useExportPdf } from "../../hooks/useExportPdf";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { PageRenderer } from "./PageRenderer";
import { AppLayout } from "../layout/AppLayout";
import { Header } from "../layout/Header";

interface PdfViewerProps {
  source: File | string;
}

function getDisplayName(source: File | string): string {
  if (typeof source === "string") {
    return source.split("/").pop()?.split("?")[0] ?? "document.pdf";
  }
  return source.name;
}

export function PdfViewer({ source }: PdfViewerProps) {
  const scale = useAppStore((state) => state.scale);
  const { doc, numPages, isLoading, error } = usePdfDocument(source);
  const { exportPdf, isExporting, registerPageRef } = useExportPdf();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts();

  const displayName = getDisplayName(source);

  return (
    <AppLayout onExport={exportPdf} isExporting={isExporting}>
      <Header fileName={displayName} numPages={numPages} />
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-slate-100"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="max-w-md w-full bg-red-50 rounded-xl p-6 text-center">
              <p className="text-red-600 font-medium mb-1">Failed to load PDF</p>
              <p className="text-red-500 text-sm">{error.message}</p>
              {typeof source === "string" && (
                <p className="text-red-400 text-xs mt-2">
                  Make sure the URL is publicly accessible and the server allows
                  cross-origin requests (CORS).
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && doc && (
          <div className="flex flex-col items-center py-6 gap-6">
            {Array.from({ length: numPages }, (_, i) => (
              <PageRenderer
                key={i}
                doc={doc}
                pageIndex={i}
                scale={scale}
                registerPageRef={registerPageRef}
              />
            ))}
          </div>
        )}
      </div>

      {isExporting && (
        <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 font-medium">Exporting PDF...</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

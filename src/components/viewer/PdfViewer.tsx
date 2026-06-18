import { useRef, useState, useCallback } from "react";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import { useAppStore } from "../../store/useAppStore";
import { useExportPdf } from "../../hooks/useExportPdf";
import { useSaveAndFax } from "../../hooks/useSaveAndFax";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { PageRenderer } from "./PageRenderer";
import { AppLayout } from "../layout/AppLayout";
import { Header } from "../layout/Header";
import { FaxDialog } from "../FaxDialog";
import { FaxStatusIndicator } from "../FaxStatusIndicator";

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
  const { exportPdf, exportBlob, isExporting, registerPageRef } = useExportPdf();
  const { run: saveAndFax, saving, error: faxSaveError } = useSaveAndFax();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [faxDialogOpen, setFaxDialogOpen] = useState(false);
  const [faxS3Key, setFaxS3Key] = useState<string | null>(null);
  const [faxDetailsId, setFaxDetailsId] = useState<string | null>(null);
  const [faxInitError, setFaxInitError] = useState<string | null>(null);

  useKeyboardShortcuts();

  const displayName = getDisplayName(source);

  const handleFax = useCallback(async () => {
    setFaxInitError(null);
    try {
      const rawName =
        typeof source === "string"
          ? (source.split("/").pop()?.split("?")[0] ?? "document.pdf")
          : source.name;
      const baseName = rawName.replace(/\.pdf$/i, "") || "filled";
      const s3Key = await saveAndFax(exportBlob, `${baseName}.pdf`);
      setFaxS3Key(s3Key);
      setFaxDialogOpen(true);
    } catch (err) {
      setFaxInitError(err instanceof Error ? err.message : "Failed to prepare fax");
    }
  }, [source, saveAndFax, exportBlob]);

  const handleFaxSent = useCallback((faxId: string) => {
    setFaxDialogOpen(false);
    setFaxDetailsId(faxId);
  }, []);

  return (
    <AppLayout
      onExport={exportPdf}
      isExporting={isExporting}
      onFax={handleFax}
      isFaxing={saving}
    >
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

      {(isExporting || saving) && (
        <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 font-medium">
              {saving ? "Saving PDF..." : "Exporting PDF..."}
            </p>
          </div>
        </div>
      )}

      {(faxInitError ?? faxSaveError) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm text-center">
          {faxInitError ?? faxSaveError}
        </div>
      )}

      {faxDetailsId && (
        <div className="absolute bottom-6 right-6 z-40 w-72">
          <FaxStatusIndicator faxDetailsId={faxDetailsId} />
        </div>
      )}

      {faxDialogOpen && faxS3Key && (
        <FaxDialog
          s3Key={faxS3Key}
          onClose={() => setFaxDialogOpen(false)}
          onSent={handleFaxSent}
        />
      )}
    </AppLayout>
  );
}

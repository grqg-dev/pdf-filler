import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
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
  if (typeof source !== "string") return source.name;
  const last = source.split("?")[0].split("/").pop() || "document.pdf";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function PdfViewer({ source }: PdfViewerProps) {
  const scale = useAppStore((state) => state.scale);
  const notice = useAppStore((state) => state.notice);
  const setNotice = useAppStore((state) => state.setNotice);
  const { doc, numPages, isLoading, error } = usePdfDocument(source);

  const displayName = getDisplayName(source);
  const baseName = displayName.replace(/\.pdf$/i, "") || "document";

  const { exportPdf, exportBlob, isExporting, exportError, clearExportError } =
    useExportPdf(doc, baseName);
  const { run: saveAndFax, saving, error: faxSaveError } = useSaveAndFax();

  const [faxDialogOpen, setFaxDialogOpen] = useState(false);
  const [faxS3Key, setFaxS3Key] = useState<string | null>(null);
  const [faxDetailsId, setFaxDetailsId] = useState<string | null>(null);
  const [faxInitError, setFaxInitError] = useState<string | null>(null);

  useKeyboardShortcuts();

  const handleFax = useCallback(async () => {
    setFaxInitError(null);
    try {
      const s3Key = await saveAndFax(exportBlob, `${baseName}.pdf`);
      setFaxS3Key(s3Key);
      setFaxDialogOpen(true);
    } catch (err) {
      console.error("Preparing fax failed", err);
      setFaxInitError(
        `Couldn't prepare the fax: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }, [baseName, saveAndFax, exportBlob]);

  const handleFaxSent = useCallback((faxId: string) => {
    setFaxDialogOpen(false);
    setFaxDetailsId(faxId);
  }, []);

  const errorMessage =
    (exportError && `Couldn't create the PDF: ${exportError}`) ||
    faxInitError ||
    (faxSaveError && !faxInitError ? faxSaveError : null) ||
    notice;

  const dismissError = () => {
    clearExportError();
    setFaxInitError(null);
    setNotice(null);
  };

  // Notices clear themselves; errors stay until dismissed.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice, setNotice]);

  return (
    <AppLayout
      onExport={exportPdf}
      isExporting={isExporting}
      onFax={handleFax}
      isFaxing={saving}
      canExport={!!doc}
    >
      <Header fileName={displayName} numPages={numPages} />
      <div className="flex-1 overflow-auto bg-slate-100">
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
                  The link may have expired. Go back to the document generator
                  and open Edit / Annotate again.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && doc && (
          <div className="flex flex-col items-center py-6 gap-6 min-w-fit px-6">
            {Array.from({ length: numPages }, (_, i) => (
              <PageRenderer key={i} doc={doc} pageIndex={i} scale={scale} />
            ))}
          </div>
        )}
      </div>

      {(isExporting || saving) && (
        <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 font-medium">
              {saving ? "Preparing fax..." : "Creating PDF..."}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-800 text-sm pl-4 pr-2 py-3 rounded-xl shadow-lg max-w-md flex items-start gap-3"
        >
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={dismissError}
            className="p-1 rounded-md hover:bg-red-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
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

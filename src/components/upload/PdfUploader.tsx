import { useCallback, useState } from "react";
import { FileUp, FileText, AlertCircle, Link } from "lucide-react";

interface PdfUploaderProps {
  onSourceSelect: (source: File | string) => void;
}

type Tab = "file" | "url";

export function PdfUploader({ onSourceSelect }: PdfUploaderProps) {
  const [tab, setTab] = useState<Tab>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const validateFile = useCallback((file: File): boolean => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onSourceSelect(file);
      }
    },
    [onSourceSelect, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUrlLoad = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    setError(null);
    onSourceSelect(trimmed);
  }, [urlInput, onSourceSelect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-5">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl font-semibold text-slate-800 mb-3 tracking-tight">
          PDF Form Filler
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Add text and checkboxes anywhere on a PDF, then download the filled result.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-200 rounded-xl mb-6 w-full max-w-xl">
        <button
          onClick={() => { setTab("file"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
            tab === "file"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileUp className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => { setTab("url"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
            tab === "url"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Link className="w-4 h-4" />
          Load from URL
        </button>
      </div>

      {/* File upload */}
      {tab === "file" && (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center w-full max-w-xl
            h-80 rounded-3xl border-2 border-dashed cursor-pointer
            transition-all duration-200 shadow-sm
            ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-blue-100"
                : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
            }
          `}
        >
          <div className="flex flex-col items-center justify-center p-8">
            <div
              className={`
                w-20 h-20 rounded-2xl flex items-center justify-center mb-5
                transition-colors duration-200
                ${isDragging ? "bg-blue-100" : "bg-slate-100"}
              `}
            >
              <FileUp
                className={`w-10 h-10 ${
                  isDragging ? "text-blue-600" : "text-slate-400"
                }`}
              />
            </div>
            <p className="text-xl font-medium text-slate-700 mb-2">
              Drop your PDF here
            </p>
            <p className="text-sm text-slate-400 mb-4">
              or click to browse your files
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              PDF files only
            </span>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />
        </label>
      )}

      {/* URL input */}
      {tab === "url" && (
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">PDF URL</p>
            <p className="text-xs text-slate-400 mb-3">
              Paste an S3 URL, presigned URL, or any direct link to a PDF.
              The server must allow cross-origin requests (CORS).
            </p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
              placeholder="https://s3.amazonaws.com/bucket/document.pdf"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleUrlLoad}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Link className="w-4 h-4" />
            Load PDF
          </button>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

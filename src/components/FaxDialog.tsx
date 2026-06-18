import { useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { FAX_NUMBER_LIST } from "../config/faxNumbers";
import { sendFax } from "../utils/api";

interface FaxDialogProps {
  s3Key: string;
  onClose: () => void;
  onSent: (faxId: string) => void;
}

function formatFaxNumber(number: string): string {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return number;
}

export function FaxDialog({ s3Key, onClose, onSent }: FaxDialogProps) {
  const [selectedFaxNumber, setSelectedFaxNumber] = useState("");
  const [customFaxNumber, setCustomFaxNumber] = useState("");
  const [subject, setSubject] = useState("Fill & Fax Document");
  const [comments, setComments] = useState("Sent via Dr. Ray Fill & Fax");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let faxNumber = selectedFaxNumber;

    if (customFaxNumber) {
      const cleaned = customFaxNumber.replace(/\D/g, "");
      if (cleaned.length !== 11) {
        setError("Fax number must be 11 digits (e.g. 18055551234)");
        return;
      }
      faxNumber = cleaned;
    }

    if (!faxNumber) {
      setError("Please select or enter a fax number");
      return;
    }

    setLoading(true);

    try {
      const result = await sendFax({ s3Key, faxNumber, coverPage: "Standard", subject, comments });
      onSent(result.faxId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send fax");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Send Fax</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSend} className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Recipient
            </label>
            <select
              value={selectedFaxNumber}
              onChange={(e) => setSelectedFaxNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a recipient --</option>
              {FAX_NUMBER_LIST.map((fax) => (
                <option key={fax.id} value={fax.number}>
                  {fax.name} — {fax.displayNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Or Enter Custom Fax Number
            </label>
            <input
              type="tel"
              value={customFaxNumber}
              onChange={(e) => setCustomFaxNumber(e.target.value)}
              placeholder="18055551234"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {customFaxNumber && (
              <p className="text-xs text-slate-400 mt-1.5">
                Formatted: {formatFaxNumber(customFaxNumber)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Fax
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

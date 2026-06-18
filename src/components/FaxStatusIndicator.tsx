import { Clock, Send, CheckCircle, XCircle, Radio, Loader2 } from "lucide-react";
import { useFaxStatus } from "../hooks/useFaxStatus";

interface FaxStatusIndicatorProps {
  faxDetailsId: string;
}

export function FaxStatusIndicator({ faxDetailsId }: FaxStatusIndicatorProps) {
  const { status, details, polling, pollCount, elapsedSeconds } = useFaxStatus(faxDetailsId);

  const getStatusDisplay = () => {
    switch (status) {
      case "queued":
        return {
          icon: Clock,
          message: "Your fax has been queued",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          iconColor: "text-blue-500",
          showSpinner: polling,
        };
      case "sending":
        return {
          icon: Send,
          message: "Fax is being sent...",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          iconColor: "text-blue-500",
          showSpinner: polling,
        };
      case "sent":
        return {
          icon: CheckCircle,
          message: "Fax sent successfully!",
          className: "bg-green-50 text-green-700 border-green-200",
          iconColor: "text-green-500",
          showSpinner: false,
        };
      case "failed":
        return {
          icon: XCircle,
          message: `Fax failed: ${(details as { details?: { errorCode?: string } })?.details?.errorCode ?? "Unknown error"}`,
          className: "bg-red-50 text-red-700 border-red-200",
          iconColor: "text-red-500",
          showSpinner: false,
        };
      default:
        return {
          icon: Radio,
          message: "Checking fax status...",
          className: "bg-slate-50 text-slate-600 border-slate-200",
          iconColor: "text-slate-400",
          showSpinner: polling,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className={`border-2 rounded-lg px-5 py-4 ${statusDisplay.className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center gap-2">
          {statusDisplay.showSpinner && <Loader2 className="w-5 h-5 animate-spin" />}
          <StatusIcon className={`w-6 h-6 ${statusDisplay.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold mb-1">{statusDisplay.message}</div>
          {polling && (
            <div className="text-xs opacity-70 mb-1">
              Poll #{pollCount} · {formatTime(elapsedSeconds)} elapsed
            </div>
          )}
          {(details as { details?: { faxDetailsId?: string } })?.details?.faxDetailsId && (
            <div className="text-xs opacity-70 font-mono">
              ID: {(details as { details?: { faxDetailsId?: string } }).details?.faxDetailsId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

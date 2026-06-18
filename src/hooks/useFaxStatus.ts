import { useState, useEffect } from "react";
import { getFaxStatus } from "../utils/api";

interface FaxStatusResult {
  status: string;
  details: unknown;
  polling: boolean;
  pollCount: number;
  elapsedSeconds: number;
}

export function useFaxStatus(faxDetailsId: string | null): FaxStatusResult {
  const [status, setStatus] = useState("queued");
  const [details, setDetails] = useState<unknown>(null);
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!faxDetailsId || !polling) return;

    let attempts = 0;
    const maxAttempts = 24;

    const interval = setInterval(async () => {
      attempts++;
      setPollCount(attempts);
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));

      try {
        const data = await getFaxStatus(faxDetailsId);
        setStatus(data.status);
        setDetails(data);

        if (data.status === "sent" || data.status === "failed" || attempts >= maxAttempts) {
          setPolling(false);
        }
      } catch (err) {
        console.error("Failed to fetch fax status:", err);
        if (attempts >= maxAttempts) {
          setPolling(false);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [faxDetailsId, polling, startTime]);

  return { status, details, polling, pollCount, elapsedSeconds };
}

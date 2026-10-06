import { useState, useEffect } from "react";
import { getFaxStatus } from "../utils/api";
import { isTerminalFaxStatus, nextFaxPollDelayMs } from "../utils/faxPoll";

interface FaxStatusResult {
  status: string;
  details: unknown;
  polling: boolean;
  timedOut: boolean;
  pollCount: number;
  elapsedSeconds: number;
}

export function useFaxStatus(faxDetailsId: string | null): FaxStatusResult {
  const [status, setStatus] = useState("queued");
  const [details, setDetails] = useState<unknown>(null);
  const [polling, setPolling] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!faxDetailsId || !polling) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      attempts += 1;
      const elapsedMs = Date.now() - startTime;
      setPollCount(attempts);
      setElapsedSeconds(Math.floor(elapsedMs / 1000));

      try {
        const data = await getFaxStatus(faxDetailsId);
        if (cancelled) return;
        setStatus(data.status);
        setDetails(data);
        if (isTerminalFaxStatus(data.status)) {
          setPolling(false);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch fax status:", err);
        if (cancelled) return;
      }

      const delay = nextFaxPollDelayMs(Date.now() - startTime);
      if (delay == null) {
        setTimedOut(true);
        setPolling(false);
        return;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, nextFaxPollDelayMs(0) ?? 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [faxDetailsId, polling, startTime]);

  return { status, details, polling, timedOut, pollCount, elapsedSeconds };
}

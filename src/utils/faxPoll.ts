export const FAX_POLL_FAST_MS = 5000;
export const FAX_POLL_SLOW_MS = 15000;
export const FAX_POLL_FAST_WINDOW_MS = 60 * 1000;
export const FAX_POLL_MAX_MS = 10 * 60 * 1000;

export function nextFaxPollDelayMs(elapsedMs: number): number | null {
  if (elapsedMs >= FAX_POLL_MAX_MS) return null;
  return elapsedMs < FAX_POLL_FAST_WINDOW_MS ? FAX_POLL_FAST_MS : FAX_POLL_SLOW_MS;
}

export function isTerminalFaxStatus(status: string): boolean {
  return status === "sent" || status === "failed";
}

const AUTH_API = import.meta.env.VITE_AUTH_API_URL || "https://s2pod1tkk6.execute-api.us-east-1.amazonaws.com/Default";
const STORAGE_KEY = "pdf_filler_auth_token";
const EXPIRES_KEY = `${STORAGE_KEY}_expires`;

type StaffSessionResponse = {
  success?: boolean;
  token?: string;
  expiresAt?: string | number;
  error?: string;
};

let botExchangeInFlight: Promise<void> | null = null;

export function getStaffAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Writes the staff session the same way password login does. */
export function storeStaffAuthToken(token: string, expiresAt?: unknown): void {
  localStorage.setItem(STORAGE_KEY, token);
  if (expiresAt) localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

export function clearStaffAuthAndReload(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export async function staffLogin(password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${AUTH_API}/fax-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const result = (await res.json()) as StaffSessionResponse;
  if (result.success && result.token) {
    storeStaffAuthToken(result.token, result.expiresAt);
    return { success: true };
  }
  return { success: false, error: result.error || "Login failed" };
}

/**
 * Reads `bot_code` from a location hash such as `#bot_code=<code>`.
 * Returns null when the parameter is missing or blank.
 */
export function parseBotCodeFromHash(hash: string): string | null {
  const params = hashParams(hash);
  if (!params) return null;
  const code = params.get("bot_code");
  if (!code) return null;
  const trimmed = code.trim();
  return trimmed || null;
}

function hashParams(hash: string): URLSearchParams | null {
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!raw) return null;
    return new URLSearchParams(raw);
  } catch {
    return null;
  }
}

function urlWithoutBotCode(pathname: string, search: string, hash: string): string {
  const params = hashParams(hash);
  params?.delete("bot_code");
  const next = params?.toString() ?? "";
  return `${pathname}${search}${next ? `#${next}` : ""}`;
}

async function postBotExchange(code: string): Promise<void> {
  try {
    const res = await fetch(`${AUTH_API}/fax-auth/bot-exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return;
    const result = (await res.json()) as StaffSessionResponse;
    if (result.success && result.token) {
      storeStaffAuthToken(result.token, result.expiresAt);
    }
  } catch {
    // Exchange failed closed. The password screen remains.
  }
}

/**
 * If the page was opened with `#bot_code=`, strip the fragment immediately
 * and exchange the code for a staff session. Concurrent callers share one
 * request so a one-time code is not spent twice.
 */
function exchangeBotCodeFromHash(): Promise<void> {
  if (botExchangeInFlight) return botExchangeInFlight;
  if (typeof window === "undefined") return Promise.resolve();

  const hash = window.location.hash;
  const params = hashParams(hash);
  if (!params?.has("bot_code")) return Promise.resolve();

  const code = parseBotCodeFromHash(hash);
  const nextUrl = urlWithoutBotCode(window.location.pathname, window.location.search, hash);
  window.history.replaceState(window.history.state, "", nextUrl);

  if (!code) return Promise.resolve();

  const pending = postBotExchange(code);
  botExchangeInFlight = pending;
  void pending.finally(() => {
    if (botExchangeInFlight === pending) botExchangeInFlight = null;
  });
  return pending;
}

export async function staffVerifyStoredToken(): Promise<boolean> {
  try {
    await exchangeBotCodeFromHash();
  } catch {
    // A broken exchange must not block the password screen.
  }

  const token = getStaffAuthToken();
  if (!token) return false;
  try {
    const res = await fetch(`${AUTH_API}/fax-auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await res.json();
    if (result.valid) {
      if (result.expiresAt) localStorage.setItem(EXPIRES_KEY, String(result.expiresAt));
      return true;
    }
    clearStaffAuthAndReload();
    return false;
  } catch {
    return false;
  }
}

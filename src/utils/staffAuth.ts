const AUTH_API = import.meta.env.VITE_AUTH_API_URL || "https://s2pod1tkk6.execute-api.us-east-1.amazonaws.com/Default";
const STORAGE_KEY = "pdf_filler_auth_token";

export function getStaffAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStaffAuthAndReload(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_expires`);
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
  const result = await res.json();
  if (result.success && result.token) {
    localStorage.setItem(STORAGE_KEY, result.token);
    if (result.expiresAt) localStorage.setItem(`${STORAGE_KEY}_expires`, String(result.expiresAt));
    return { success: true };
  }
  return { success: false, error: result.error || "Login failed" };
}

export async function staffVerifyStoredToken(): Promise<boolean> {
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
      if (result.expiresAt) localStorage.setItem(`${STORAGE_KEY}_expires`, String(result.expiresAt));
      return true;
    }
    clearStaffAuthAndReload();
    return false;
  } catch {
    return false;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseBotCodeFromHash,
  staffLogin,
  staffVerifyStoredToken,
  storeStaffAuthToken,
} from "./staffAuth";

const TOKEN_KEY = "pdf_filler_auth_token";
const EXPIRES_KEY = "pdf_filler_auth_token_expires";

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function installStorage(): StorageMock {
  const mem = new Map<string, string>();
  const storage: StorageMock = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => {
      mem.set(key, String(value));
    },
    removeItem: (key) => {
      mem.delete(key);
    },
    clear: () => {
      mem.clear();
    },
  };
  vi.stubGlobal("localStorage", storage);
  return storage;
}

function installWindow(hash: string, search = ""): {
  replaceState: ReturnType<typeof vi.fn>;
  location: { pathname: string; search: string; hash: string; reload: ReturnType<typeof vi.fn> };
} {
  const location = {
    pathname: "/",
    search,
    hash,
    reload: vi.fn(),
  };
  const replaceState = vi.fn((_state: unknown, _title: string, url: string) => {
    const hashAt = url.indexOf("#");
    location.hash = hashAt === -1 ? "" : url.slice(hashAt);
  });
  vi.stubGlobal("window", {
    location,
    history: { state: { kept: true }, replaceState },
  });
  return { replaceState, location };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  installStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseBotCodeFromHash", () => {
  it("reads bot_code from the hash", () => {
    expect(parseBotCodeFromHash("#bot_code=abc123")).toBe("abc123");
  });

  it("decodes the code and ignores other hash parameters", () => {
    expect(parseBotCodeFromHash("#section=2&bot_code=ab%2Dcd&x=1")).toBe("ab-cd");
  });

  it("uses the first bot_code when the hash repeats it", () => {
    expect(parseBotCodeFromHash("#bot_code=first&bot_code=second")).toBe("first");
  });

  it("returns null when the code is missing or blank", () => {
    expect(parseBotCodeFromHash("")).toBeNull();
    expect(parseBotCodeFromHash("#")).toBeNull();
    expect(parseBotCodeFromHash("#page=1")).toBeNull();
    expect(parseBotCodeFromHash("#bot_code=")).toBeNull();
    expect(parseBotCodeFromHash("#bot_code=%20%20")).toBeNull();
    expect(parseBotCodeFromHash("#Bot_Code=abc")).toBeNull();
  });
});

describe("storeStaffAuthToken", () => {
  it("writes the token and expiry to the password-login keys", () => {
    storeStaffAuthToken("staff-token", 1_700_000_000_000);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("staff-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("1700000000000");
  });

  it("stores a string expiry unchanged", () => {
    storeStaffAuthToken("staff-token", "2026-10-16T00:00:00.000Z");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("staff-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("2026-10-16T00:00:00.000Z");
  });

  it("writes the token without replacing an existing expiry when none is provided", () => {
    localStorage.setItem(EXPIRES_KEY, "previous");
    storeStaffAuthToken("staff-token");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("staff-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("previous");
  });
});

describe("staffLogin", () => {
  it("still stores a password-login session on the same keys", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(String(url).endsWith("/fax-auth/login")).toBe(true);
      return jsonResponse({ success: true, token: "pw-token", expiresAt: 99 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await staffLogin("office-password");
    expect(result).toEqual({ success: true });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("pw-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("99");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the login error and does not write a token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ success: false, error: "Invalid password" }, 401)),
    );

    const result = await staffLogin("wrong");
    expect(result).toEqual({ success: false, error: "Invalid password" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(EXPIRES_KEY)).toBeNull();
  });
});

describe("staffVerifyStoredToken bot exchange", () => {
  it("strips bot_code, exchanges it, then verifies the stored staff token", async () => {
    const code = "one-time-code-9f3c2a";
    const token = "staff-token-9f3c2a";
    const { replaceState } = installWindow(`#bot_code=${code}&section=2`, "?url=https%3A%2F%2Fexample.com%2Fa.pdf");
    let hashCleared = false;
    const calls: string[] = [];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const target = String(url);
        calls.push(target);
        expect(hashCleared).toBe(true);
        if (target.endsWith("/fax-auth/bot-exchange")) {
          expect(init?.method).toBe("POST");
          expect(init?.headers).toEqual({ "Content-Type": "application/json" });
          expect(JSON.parse(String(init?.body))).toEqual({ code });
          const headerText = JSON.stringify(init?.headers).toLowerCase();
          expect(headerText).not.toContain("api-key");
          expect(headerText).not.toContain("authorization");
          return jsonResponse({ success: true, token, expiresAt: 123456 });
        }
        expect(target.endsWith("/fax-auth/verify")).toBe(true);
        expect(JSON.parse(String(init?.body))).toEqual({ token });
        expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
        expect(localStorage.getItem(EXPIRES_KEY)).toBe("123456");
        return jsonResponse({ valid: true, expiresAt: 654321 });
      }),
    );

    replaceState.mockImplementation((state: unknown, title: string, url: string) => {
      expect(state).toEqual({ kept: true });
      expect(title).toBe("");
      expect(url).toBe("/?url=https%3A%2F%2Fexample.com%2Fa.pdf#section=2");
      expect(url).not.toContain(code);
      expect(url).not.toContain("bot_code");
      hashCleared = true;
      const hashAt = url.indexOf("#");
      window.location.hash = hashAt === -1 ? "" : url.slice(hashAt);
    });

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(true);
    expect(calls.map((url) => url.slice(url.lastIndexOf("/")))).toEqual([
      "/bot-exchange",
      "/verify",
    ]);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("654321");
    expect(replaceState).toHaveBeenCalledTimes(1);

    for (const spy of [log, info, debug, warn, error]) {
      for (const args of spy.mock.calls) {
        const text = args.map((part) => String(part)).join(" ");
        expect(text).not.toContain(code);
        expect(text).not.toContain(token);
      }
    }
  });

  it("clears a blank bot_code and shows the password path without posting", async () => {
    const { replaceState, location } = installWindow("#bot_code=%20");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(String(replaceState.mock.calls[0]?.[2])).not.toContain("bot_code");
    expect(location.hash).toBe("");
  });

  it("leaves the password path in place when the exchange is rejected", async () => {
    const { replaceState } = installWindow("#bot_code=rejected-code");
    const fetchMock = vi.fn(async (url: string) => {
      expect(String(url).endsWith("/fax-auth/bot-exchange")).toBe(true);
      return jsonResponse({ success: false }, 401);
    });
    vi.stubGlobal("fetch", fetchMock);

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(EXPIRES_KEY)).toBeNull();
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("leaves the password path in place when the exchange cannot be reached", async () => {
    installWindow("#bot_code=offline-code");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("does not replace an existing session when the exchange fails", async () => {
    localStorage.setItem(TOKEN_KEY, "existing-token");
    localStorage.setItem(EXPIRES_KEY, "111");
    installWindow("#bot_code=rejected-code");
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(String(url));
        if (String(url).endsWith("/fax-auth/bot-exchange")) {
          return jsonResponse({ success: false }, 401);
        }
        expect(JSON.parse(String(init?.body))).toEqual({ token: "existing-token" });
        return jsonResponse({ valid: true, expiresAt: 222 });
      }),
    );

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("existing-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("222");
  });

  it("exchanges one code once when the auth check overlaps", async () => {
    installWindow("#bot_code=shared-code");
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let exchangeCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/fax-auth/bot-exchange")) {
          exchangeCalls += 1;
          await gate;
          return jsonResponse({ success: true, token: "shared-token", expiresAt: 5 });
        }
        return jsonResponse({ valid: true });
      }),
    );

    const first = staffVerifyStoredToken();
    const second = staffVerifyStoredToken();
    release();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(exchangeCalls).toBe(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("shared-token");
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("5");
  });

  it("verifies a stored token when the hash has no bot code", async () => {
    localStorage.setItem(TOKEN_KEY, "existing-token");
    const { replaceState } = installWindow("");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url).endsWith("/fax-auth/verify")).toBe(true);
      expect(JSON.parse(String(init?.body))).toEqual({ token: "existing-token" });
      return jsonResponse({ valid: true, expiresAt: 50 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ok = await staffVerifyStoredToken();

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
    expect(localStorage.getItem(EXPIRES_KEY)).toBe("50");
  });
});

import { useEffect, useState } from "react";
import { useAppStore } from "./store/useAppStore";
import { PdfUploader } from "./components/upload/PdfUploader";
import { PdfViewer } from "./components/viewer/PdfViewer";
import { staffLogin, staffVerifyStoredToken } from "./utils/staffAuth";

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await staffLogin(password);
    setLoading(false);
    if (result.success) onSuccess();
    else setError(result.error || "Login failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] px-4">
      <form onSubmit={onSubmit} className="max-w-sm w-full bg-white border rounded-lg p-8 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold text-center text-[#3D3833]">PDF Filler</h1>
        <p className="text-sm text-center text-gray-500">Enter your password to continue</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-lg bg-[#FBF8F4]"
          placeholder="Password"
          autoFocus
          disabled={loading}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full py-2.5 rounded-lg bg-[#B8847A] text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

function App() {
  const pdfSource = useAppStore((state) => state.pdfSource);
  const setPdfSource = useAppStore((state) => state.setPdfSource);
  const [authState, setAuthState] = useState<"loading" | "login" | "ok">("loading");

  useEffect(() => {
    staffVerifyStoredToken().then((ok) => setAuthState(ok ? "ok" : "login"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      try {
        new URL(urlParam);
        setPdfSource(urlParam);
      } catch {
        // ignore invalid URL param
      }
    }
  }, [setPdfSource]);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (authState === "login") {
    return <LoginGate onSuccess={() => setAuthState("ok")} />;
  }

  if (!pdfSource) {
    return <PdfUploader onSourceSelect={setPdfSource} />;
  }

  const key = typeof pdfSource === "string" ? pdfSource : pdfSource.name;
  return <PdfViewer key={key} source={pdfSource} />;
}

export default App;

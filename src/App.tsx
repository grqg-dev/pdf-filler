import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { PdfUploader } from "./components/upload/PdfUploader";
import { PdfViewer } from "./components/viewer/PdfViewer";

function App() {
  const pdfSource = useAppStore((state) => state.pdfSource);
  const setPdfSource = useAppStore((state) => state.setPdfSource);

  // Auto-load from ?url= query param
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

  if (!pdfSource) {
    return <PdfUploader onSourceSelect={setPdfSource} />;
  }

  const key = typeof pdfSource === "string" ? pdfSource : pdfSource.name;
  return <PdfViewer key={key} source={pdfSource} />;
}

export default App;

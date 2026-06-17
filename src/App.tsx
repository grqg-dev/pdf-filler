import { useAppStore } from "./store/useAppStore";
import { PdfUploader } from "./components/upload/PdfUploader";
import { PdfViewer } from "./components/viewer/PdfViewer";

function App() {
  const pdfFile = useAppStore((state) => state.pdfFile);
  const setPdfFile = useAppStore((state) => state.setPdfFile);

  if (!pdfFile) {
    return <PdfUploader onFileSelect={setPdfFile} />;
  }

  return <PdfViewer key={pdfFile.name} file={pdfFile} />;
}

export default App;

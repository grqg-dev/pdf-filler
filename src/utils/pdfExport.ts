import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface ExportPageData {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  overlayElement: HTMLElement;
  widthPts: number;
  heightPts: number;
}

export async function exportToPdf(
  pages: ExportPageData[],
  fileName: string
): Promise<void> {
  if (pages.length === 0) {
    throw new Error("No pages to export");
  }

  const doc = new jsPDF({
    unit: "pt",
    format: [pages[0].widthPts, pages[0].heightPts],
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    if (i > 0) {
      doc.addPage([page.widthPts, page.heightPts]);
    }

    const compositeCanvas = await compositePage(page);
    const imgData = compositeCanvas.toDataURL("image/png");

    doc.addImage(
      imgData,
      "PNG",
      0,
      0,
      page.widthPts,
      page.heightPts,
      undefined,
      "FAST"
    );
  }

  doc.save(fileName);
}

async function compositePage(page: ExportPageData): Promise<HTMLCanvasElement> {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = page.canvas.width / dpr;
  const cssHeight = page.canvas.height / dpr;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = Math.floor(cssWidth);
  outputCanvas.height = Math.floor(cssHeight);

  const ctx = outputCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create export canvas context");
  }

  ctx.drawImage(page.canvas, 0, 0, cssWidth, cssHeight);

  const annotationCanvas = await html2canvas(page.overlayElement, {
    scale: 1,
    backgroundColor: null,
    logging: false,
    useCORS: true,
    width: cssWidth,
    height: cssHeight,
    windowWidth: cssWidth,
    windowHeight: cssHeight,
  });

  ctx.drawImage(annotationCanvas, 0, 0);

  return outputCanvas;
}

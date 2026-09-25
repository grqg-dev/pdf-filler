import { jsPDF } from "jspdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Annotation } from "../types";
import { isCoverAnnotation } from "../store/useAnnotationStore";
import { EXPORT_DPI, INK_COLOR, TEXT_FONT_FAMILY, TEXT_PADDING } from "./constants";
import { textLineHeight, wrapText } from "./textLayout";

/** Points on a unit square for the check mark; shared with the editor. */
export const CHECK_MARK_POINTS: [number, number][] = [
  [0.18, 0.55],
  [0.42, 0.78],
  [0.84, 0.24],
];

export function checkStrokeWidth(boxWidth: number): number {
  return Math.max(1.2, boxWidth * 0.14);
}

/**
 * Flatten the PDF and its annotations into a new PDF.
 *
 * Each page is re-rendered with pdf.js at EXPORT_DPI and the annotations are
 * painted straight onto that bitmap. Rasterising is deliberate: anything
 * under a white-out is really gone from the output, not just hidden behind a
 * shape where it could still be selected or copied.
 */
export async function exportToBlob(
  doc: PDFDocumentProxy,
  annotationsByPage: Record<number, Annotation[]>
): Promise<Blob> {
  const renderScale = EXPORT_DPI / 72;
  let pdf: jsPDF | null = null;

  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex++) {
    const page = await doc.getPage(pageIndex + 1);
    const pageSize = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create export canvas");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const annotations = annotationsByPage[pageIndex] ?? [];
    const ordered = [
      ...annotations.filter(isCoverAnnotation),
      ...annotations.filter((a) => !isCoverAnnotation(a)),
    ];
    for (const annotation of ordered) {
      await drawAnnotation(ctx, annotation, renderScale);
    }

    const orientation = pageSize.width > pageSize.height ? "l" : "p";
    const format: [number, number] = [pageSize.width, pageSize.height];
    if (!pdf) {
      pdf = new jsPDF({ unit: "pt", format, orientation, compress: true });
    } else {
      pdf.addPage(format, orientation);
    }
    pdf.addImage(canvas, "PNG", 0, 0, pageSize.width, pageSize.height, undefined, "FAST");
    page.cleanup();
  }

  if (!pdf) throw new Error("No pages to export");
  return pdf.output("blob");
}

export async function exportToFile(
  doc: PDFDocumentProxy,
  annotationsByPage: Record<number, Annotation[]>,
  fileName: string
): Promise<void> {
  const blob = await exportToBlob(doc, annotationsByPage);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  s: number
): Promise<void> {
  const x = annotation.x * s;
  const y = annotation.y * s;
  const w = annotation.width * s;
  const h = annotation.height * s;

  switch (annotation.type) {
    case "whiteout": {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, w, h);
      return;
    }

    case "eraser": {
      const { points, strokeWidth } = annotation;
      if (points.length === 0) return;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = strokeWidth * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x * s, points[0].y * s, (strokeWidth * s) / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x * s, points[0].y * s);
      for (const p of points.slice(1)) ctx.lineTo(p.x * s, p.y * s);
      ctx.stroke();
      return;
    }

    case "text": {
      if (!annotation.value.trim()) return;
      const lines = wrapText(
        annotation.value,
        annotation.fontSize,
        annotation.width - TEXT_PADDING * 2
      );
      const lineHeight = textLineHeight(annotation.fontSize) * s;
      ctx.fillStyle = INK_COLOR;
      ctx.font = `${annotation.fontSize * s}px ${TEXT_FONT_FAMILY}`;
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          x + TEXT_PADDING * s,
          y + TEXT_PADDING * s + i * lineHeight + lineHeight / 2
        );
      });
      return;
    }

    case "checkbox": {
      if (!annotation.checked) return;
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = checkStrokeWidth(annotation.width) * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      CHECK_MARK_POINTS.forEach(([px, py], i) => {
        const cx = x + px * w;
        const cy = y + py * h;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      return;
    }

    case "image": {
      const img = await loadImage(annotation.src);
      const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * fit;
      const dh = img.naturalHeight * fit;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      return;
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for export"));
    img.src = src;
  });
}

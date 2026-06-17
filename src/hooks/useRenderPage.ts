import { useEffect, useState } from "react";
import type { PDFPageProxy, RenderTask } from "pdfjs-dist";

interface UseRenderPageResult {
  isRendering: boolean;
  renderError: Error | null;
}

export function useRenderPage(
  page: PDFPageProxy | null,
  scale: number,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): UseRenderPageResult {
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) {
      setIsRendering(false);
      setRenderError(null);
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      setRenderError(new Error("Could not get canvas context"));
      return;
    }

    let renderTask: RenderTask | null = null;
    let cancelled = false;

    setIsRendering(true);
    setRenderError(null);

    const render = async () => {
      try {
        const viewport = page.getViewport({ scale });

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        renderTask = page.render({
          canvas: canvas,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!cancelled) {
          setIsRendering(false);
        }
      } catch (err) {
        if (cancelled) return;
        setRenderError(
          err instanceof Error ? err : new Error("Failed to render page")
        );
        setIsRendering(false);
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [page, scale, canvasRef]);

  return { isRendering, renderError };
}

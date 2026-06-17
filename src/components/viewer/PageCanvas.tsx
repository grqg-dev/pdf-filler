import { forwardRef, useEffect, useRef } from "react";
import { useRenderPage } from "../../hooks/useRenderPage";
import type { PDFPageProxy } from "pdfjs-dist";

interface PageCanvasProps {
  page: PDFPageProxy;
  scale: number;
}

export const PageCanvas = forwardRef<HTMLCanvasElement, PageCanvasProps>(
  function PageCanvas({ page, scale }, forwardedRef) {
    const innerRef = useRef<HTMLCanvasElement>(null);
    const { isRendering, renderError } = useRenderPage(
      page,
      scale,
      innerRef
    );

    useEffect(() => {
      if (typeof forwardedRef === "function") {
        forwardedRef(innerRef.current);
      } else if (forwardedRef) {
        forwardedRef.current = innerRef.current;
      }
    }, [forwardedRef]);

    return (
      <div className="relative">
        <canvas
          ref={innerRef}
          className="block shadow-sm"
          style={{ backgroundColor: "white" }}
        />
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/90">
            <p className="text-red-600 text-sm font-medium">Render error</p>
          </div>
        )}
      </div>
    );
  }
);

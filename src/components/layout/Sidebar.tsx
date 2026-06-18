import {
  MousePointer,
  Type,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  PenTool,
  Send,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAnnotationStore } from "../../store/useAnnotationStore";
import { ToolbarButton } from "./ToolbarButton";
import type { Tool } from "../../types";

interface SidebarProps {
  onExport: () => void;
  isExporting: boolean;
  onFax?: () => void;
  isFaxing?: boolean;
}

const TOOLS: { id: Tool; label: string; icon: typeof MousePointer }[] = [
  { id: "select", label: "Select", icon: MousePointer },
  { id: "text", label: "Text", icon: Type },
  { id: "checkbox", label: "Check", icon: CheckSquare },
  { id: "image", label: "Sign", icon: PenTool },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40];

export function Sidebar({ onExport, isExporting, onFax, isFaxing }: SidebarProps) {
  const tool = useAppStore((state) => state.tool);
  const scale = useAppStore((state) => state.scale);
  const textFontSize = useAppStore((state) => state.textFontSize);
  const setTextFontSize = useAppStore((state) => state.setTextFontSize);
  const selectedId = useAppStore((state) => state.selectedId);
  const setTool = useAppStore((state) => state.setTool);
  const zoomIn = useAppStore((state) => state.zoomIn);
  const zoomOut = useAppStore((state) => state.zoomOut);
  const setPdfSource = useAppStore((state) => state.setPdfSource);
  const resetApp = useAppStore((state) => state.reset);
  const resetAnnotations = useAnnotationStore((state) => state.reset);
  const updateAnnotation = useAnnotationStore(
    (state) => state.updateAnnotation
  );

  const selectedAnnotation = useAnnotationStore((state) => {
    if (!selectedId) return undefined;
    for (const annotations of Object.values(state.annotationsByPage)) {
      const found = annotations.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return undefined;
  });

  const isTextActive =
    tool === "text" || selectedAnnotation?.type === "text";

  const currentFontSize =
    selectedAnnotation?.type === "text"
      ? selectedAnnotation.fontSize
      : textFontSize;

  const handleFontSizeChange = (size: number) => {
    setTextFontSize(size);
    if (selectedAnnotation?.type === "text") {
      updateAnnotation(selectedAnnotation.id, (a) => ({
        ...a,
        fontSize: size,
      }));
    }
  };

  const handleUploadNew = () => {
    resetApp();
    resetAnnotations();
    setPdfSource(null);
  };

  return (
    <aside className="flex flex-col items-center w-20 py-4 bg-white border-r border-slate-200 shadow-sm z-10">
      <div className="flex flex-col items-center gap-1.5 mb-4">
        {TOOLS.map(({ id, label, icon }) => (
          <div key={id} className="flex flex-col items-center gap-1">
            <ToolbarButton
              icon={icon}
              label={label}
              isActive={tool === id}
              onClick={() => setTool(id)}
            />
            {id === "text" && isTextActive && (
              <div className="flex flex-col items-center py-2 px-1 mx-1 rounded-xl bg-slate-50 border border-slate-100">
                <label
                  htmlFor="font-size"
                  className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Size
                </label>
                <select
                  id="font-size"
                  value={currentFontSize}
                  onChange={(e) =>
                    handleFontSizeChange(Number(e.target.value))
                  }
                  className="w-[4.5rem] h-8 text-xs text-center bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="w-12 h-px bg-slate-200 mb-4" />

      <div className="flex flex-col gap-1.5 mb-4">
        <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={zoomIn} />
        <div className="text-xs font-semibold text-slate-400 text-center py-1">
          {Math.round(scale * 100)}%
        </div>
        <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={zoomOut} />
      </div>

      <div className="w-12 h-px bg-slate-200 mb-4" />

      <div className="flex flex-col gap-1.5 mt-auto">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={onExport}
          disabled={isExporting || isFaxing}
        />
        {onFax && (
          <ToolbarButton
            icon={Send}
            label="Fax"
            onClick={onFax}
            disabled={isExporting || isFaxing}
          />
        )}
        <ToolbarButton
          icon={Upload}
          label="New"
          onClick={handleUploadNew}
          disabled={isExporting || isFaxing}
        />
      </div>
    </aside>
  );
}

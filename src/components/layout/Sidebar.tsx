import {
  MousePointer,
  Type,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Signature,
  Send,
  RectangleHorizontal,
  Eraser,
  Undo2,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAnnotationStore } from "../../store/useAnnotationStore";
import { useAnnotationActions } from "../../hooks/useAnnotationActions";
import { ToolbarButton } from "./ToolbarButton";
import { ERASER_SIZES, TEXT_FONT_SIZES } from "../../utils/constants";
import type { Tool } from "../../types";

interface SidebarProps {
  onExport: () => void;
  isExporting: boolean;
  onFax?: () => void;
  isFaxing?: boolean;
  canExport?: boolean;
}

const TOOLS: { id: Tool; label: string; icon: typeof MousePointer; hint: string }[] = [
  { id: "select", label: "Select", icon: MousePointer, hint: "Select, move, and resize items (V)" },
  { id: "text", label: "Text", icon: Type, hint: "Click the page to add text (T)" },
  { id: "checkbox", label: "Check", icon: CheckSquare, hint: "Click to add a check mark (C)" },
  { id: "image", label: "Sign", icon: Signature, hint: "Click to place Dr. Ray's signature (S)" },
  { id: "whiteout", label: "White-out", icon: RectangleHorizontal, hint: "Drag a white box over text to cover it (W)" },
  { id: "eraser", label: "Eraser", icon: Eraser, hint: "Paint white over the page (E)" },
];

const panelClass =
  "flex flex-col items-center py-2 px-1 mx-1 rounded-xl bg-slate-50 border border-slate-100";
const panelLabelClass =
  "text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";
const selectClass =
  "w-[4.5rem] h-8 text-xs text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export function Sidebar({ onExport, isExporting, onFax, isFaxing, canExport = true }: SidebarProps) {
  const tool = useAppStore((state) => state.tool);
  const scale = useAppStore((state) => state.scale);
  const textFontSize = useAppStore((state) => state.textFontSize);
  const setTextFontSize = useAppStore((state) => state.setTextFontSize);
  const eraserSize = useAppStore((state) => state.eraserSize);
  const setEraserSize = useAppStore((state) => state.setEraserSize);
  const selectedId = useAppStore((state) => state.selectedId);
  const setTool = useAppStore((state) => state.setTool);
  const zoomIn = useAppStore((state) => state.zoomIn);
  const zoomOut = useAppStore((state) => state.zoomOut);
  const setPdfSource = useAppStore((state) => state.setPdfSource);
  const resetApp = useAppStore((state) => state.reset);
  const resetAnnotations = useAnnotationStore((state) => state.reset);
  const undo = useAnnotationStore((state) => state.undo);
  const canUndo = useAnnotationStore((state) => state.past.length > 0);
  const hasEdits = useAnnotationStore(
    (state) => Object.values(state.annotationsByPage).some((list) => list.length > 0)
  );
  const { setTextFontSizeFor } = useAnnotationActions();

  const selectedAnnotation = useAnnotationStore((state) => {
    if (!selectedId) return undefined;
    for (const annotations of Object.values(state.annotationsByPage)) {
      const found = annotations.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return undefined;
  });

  const isTextActive = tool === "text" || selectedAnnotation?.type === "text";

  const currentFontSize =
    selectedAnnotation?.type === "text" ? selectedAnnotation.fontSize : textFontSize;

  const handleFontSizeChange = (size: number) => {
    setTextFontSize(size);
    if (selectedAnnotation?.type === "text") {
      setTextFontSizeFor(selectedAnnotation.id, size);
    }
  };

  const handleUploadNew = () => {
    if (hasEdits && !window.confirm("Discard your edits and open a different PDF?")) return;
    resetApp();
    resetAnnotations();
    setPdfSource(null);
  };

  const busy = isExporting || isFaxing;

  return (
    <aside className="flex flex-col items-center w-20 py-3 bg-white border-r border-slate-200 shadow-sm z-10 overflow-y-auto">
      <div className="flex flex-col items-center gap-1 mb-3">
        {TOOLS.map(({ id, label, icon, hint }) => (
          <div key={id} className="flex flex-col items-center gap-1">
            <ToolbarButton
              icon={icon}
              label={label}
              title={hint}
              isActive={tool === id}
              onClick={() => {
                (document.activeElement as HTMLElement | null)?.blur?.();
                setTool(id);
              }}
            />
            {id === "text" && isTextActive && (
              <div className={panelClass}>
                <label htmlFor="font-size" className={panelLabelClass}>
                  Size
                </label>
                <select
                  id="font-size"
                  value={currentFontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className={selectClass}
                >
                  {TEXT_FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} pt
                    </option>
                  ))}
                </select>
              </div>
            )}
            {id === "eraser" && tool === "eraser" && (
              <div className={panelClass}>
                <label htmlFor="eraser-size" className={panelLabelClass}>
                  Brush
                </label>
                <select
                  id="eraser-size"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                  className={selectClass}
                >
                  {ERASER_SIZES.map((size, i) => (
                    <option key={size} value={size}>
                      {["Fine", "Small", "Medium", "Large"][i] ?? `${size} pt`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="w-12 h-px bg-slate-200 mb-3" />

      <div className="flex flex-col items-center gap-1 mb-3">
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          title="Undo (Ctrl/Cmd+Z)"
          onClick={undo}
          disabled={!canUndo}
        />
        <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={zoomIn} />
        <div className="text-xs font-semibold text-slate-500 text-center py-0.5">
          {Math.round(scale * 100)}%
        </div>
        <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={zoomOut} />
      </div>

      <div className="w-12 h-px bg-slate-200 mb-3" />

      <div className="flex flex-col gap-1 mt-auto">
        <ToolbarButton
          icon={Download}
          label="Download"
          title="Download the edited PDF"
          onClick={onExport}
          disabled={busy || !canExport}
        />
        {onFax && (
          <ToolbarButton
            icon={Send}
            label="Fax"
            title="Fax the edited PDF"
            onClick={onFax}
            disabled={busy || !canExport}
          />
        )}
        <ToolbarButton
          icon={Upload}
          label="New"
          title="Open a different PDF"
          onClick={handleUploadNew}
          disabled={busy}
        />
      </div>
    </aside>
  );
}

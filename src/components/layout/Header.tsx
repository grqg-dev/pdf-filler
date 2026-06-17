import { FileText, Keyboard } from "lucide-react";

interface HeaderProps {
  fileName: string;
  numPages: number;
}

export function Header({ fileName, numPages }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 truncate max-w-[240px] sm:max-w-md">
            {fileName}
          </h1>
          <p className="text-xs text-slate-400">
            {numPages} page{numPages === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Delete to remove</span>
        </div>
        <span className="text-slate-300">|</span>
        <span>Esc to deselect</span>
      </div>
    </header>
  );
}

import type { LucideIcon } from "lucide-react";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  title?: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ToolbarButton({
  icon: Icon,
  label,
  title,
  isActive = false,
  onClick,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Keep focus in an open text box so its edit isn't cut short.
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      aria-pressed={isActive}
      title={title ?? label}
      className={`
        flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl
        transition-colors duration-150 focus:outline-none focus-visible:ring-2
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${
          isActive
            ? "bg-blue-100 text-blue-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

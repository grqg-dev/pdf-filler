import { RESIZE_HANDLE_SIZE } from "../../utils/constants";

interface ResizeHandleProps {
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  cursor?: string;
}

export function ResizeHandle({ handlers, cursor = "se-resize" }: ResizeHandleProps) {
  return (
    <div
      {...handlers}
      onMouseDown={(e) => e.preventDefault()}
      aria-hidden="true"
      className="absolute z-20 rounded-sm bg-blue-600 border-2 border-white shadow"
      style={{
        right: -RESIZE_HANDLE_SIZE / 2,
        bottom: -RESIZE_HANDLE_SIZE / 2,
        width: RESIZE_HANDLE_SIZE,
        height: RESIZE_HANDLE_SIZE,
        cursor,
        touchAction: "none",
      }}
    />
  );
}

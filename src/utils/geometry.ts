import type { Rect } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function constrainRectToBounds(
  rect: Rect,
  boundsWidth: number,
  boundsHeight: number,
  minWidth: number,
  minHeight: number
): Rect {
  const width = clamp(rect.width, minWidth, boundsWidth);
  const height = clamp(rect.height, minHeight, boundsHeight);
  const x = clamp(rect.x, 0, boundsWidth - width);
  const y = clamp(rect.y, 0, boundsHeight - height);

  return { x, y, width, height };
}

export function getRelativeMousePosition(
  container: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

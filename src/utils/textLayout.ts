import { TEXT_FONT_FAMILY, TEXT_LINE_HEIGHT, TEXT_PADDING } from "./constants";

// Measure at a large size and scale down, so browser font hinting at small
// pixel sizes doesn't skew the widths.
const MEASURE_SCALE = 10;

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(fontSize: number): CanvasRenderingContext2D {
  if (!measureCtx) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) throw new Error("Could not create text measuring context");
    measureCtx = ctx;
  }
  measureCtx.font = `${fontSize * MEASURE_SCALE}px ${TEXT_FONT_FAMILY}`;
  return measureCtx;
}

/**
 * Word-wrap `value` to fit `maxWidth` (page units). Mirrors CSS
 * `white-space: pre-wrap; overflow-wrap: anywhere` closely enough that the
 * editor and the exported PDF break lines in the same places.
 */
export function wrapText(value: string, fontSize: number, maxWidth: number): string[] {
  const ctx = getMeasureContext(fontSize);
  const measure = (s: string) => ctx.measureText(s).width / MEASURE_SCALE;
  const lines: string[] = [];

  for (const paragraph of value.split("\n")) {
    const words = paragraph.split(/(\s+)/);
    let line = "";

    for (const word of words) {
      if (!word) continue;
      const candidate = line + word;
      if (measure(candidate.trimEnd()) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (/^\s+$/.test(word)) {
        // Trailing whitespace at a break is dropped, like CSS.
        lines.push(line.trimEnd());
        line = "";
        continue;
      }
      if (line) lines.push(line.trimEnd());
      // A single word wider than the box breaks by character.
      let chunk = "";
      for (const ch of word) {
        if (chunk && measure(chunk + ch) > maxWidth) {
          lines.push(chunk);
          chunk = "";
        }
        chunk += ch;
      }
      line = chunk;
    }
    lines.push(line.trimEnd());
  }

  return lines;
}

export function textLineHeight(fontSize: number): number {
  return fontSize * TEXT_LINE_HEIGHT;
}

/** Height (page units) a text box needs to show every line of `value`. */
export function measureTextBoxHeight(value: string, fontSize: number, width: number): number {
  const lines = wrapText(value, fontSize, width - TEXT_PADDING * 2);
  return Math.max(1, lines.length) * textLineHeight(fontSize) + TEXT_PADDING * 2;
}

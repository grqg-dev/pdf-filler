export const DEFAULT_SCALE = 1.5;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 3;
export const SCALE_STEP = 0.25;

// Sizes below are in page units (PDF points), not screen pixels.
export const DEFAULT_TEXT_ANNOTATION = {
  width: 180,
  height: 16,
  fontSize: 11,
};

export const TEXT_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];

/** Shared by the editor and the exporter so wrapped lines match. */
export const TEXT_FONT_FAMILY = "Helvetica, Arial, sans-serif";
export const TEXT_LINE_HEIGHT = 1.2;
export const TEXT_PADDING = 2;

export const DEFAULT_CHECKBOX_ANNOTATION = {
  width: 12,
  height: 12,
};

export const DEFAULT_SIGNATURE_WIDTH = 72;

export const DEFAULT_ERASER_SIZE = 12;
export const ERASER_SIZES = [6, 12, 20, 32];

export const MIN_ANNOTATION_WIDTH = 8;
export const MIN_ANNOTATION_HEIGHT = 8;

/** Screen pixels, not page units. */
export const RESIZE_HANDLE_SIZE = 10;

/** Ink colour for text and check marks on the output. Black faxes best. */
export const INK_COLOR = "#000000";

/** 200 dpi matches SRFax "fine" resolution. */
export const EXPORT_DPI = 200;

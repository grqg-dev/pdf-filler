export type Tool = "select" | "text" | "checkbox" | "image" | "whiteout" | "eraser";

export type AnnotationType = "text" | "checkbox" | "image" | "whiteout" | "eraser";

/**
 * All geometry is in page units: the pdf.js viewport at scale 1 (PDF points,
 * with page rotation already applied). The editor multiplies by the current
 * zoom to render, and the exporter multiplies by the export scale, so
 * annotations stay put when the user zooms.
 */
export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  value: string;
  fontSize: number;
}

export interface CheckboxAnnotation extends BaseAnnotation {
  type: "checkbox";
  checked: boolean;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  src: string;
}

/** Opaque white rectangle that covers whatever is under it. */
export interface WhiteoutAnnotation extends BaseAnnotation {
  type: "whiteout";
}

/** Freehand white brush stroke. x/y/width/height is the stroke's bounding box. */
export interface EraserAnnotation extends BaseAnnotation {
  type: "eraser";
  points: Point[];
  strokeWidth: number;
}

export type Annotation =
  | TextAnnotation
  | CheckboxAnnotation
  | ImageAnnotation
  | WhiteoutAnnotation
  | EraserAnnotation;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

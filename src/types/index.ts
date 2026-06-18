export type Tool = "select" | "text" | "checkbox" | "image";

export type AnnotationType = "text" | "checkbox" | "image";

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

export type Annotation = TextAnnotation | CheckboxAnnotation | ImageAnnotation;

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

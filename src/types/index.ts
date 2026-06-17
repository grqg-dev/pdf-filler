export type Tool = "select" | "text" | "checkbox";

export type AnnotationType = "text" | "checkbox";

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

export type Annotation = TextAnnotation | CheckboxAnnotation;

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

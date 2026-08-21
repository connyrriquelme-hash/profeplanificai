/** Canvas layout types — the "Fase 3" visual design layer.
 *
 * Lives alongside the structured product.data as an optional overlay:
 * product.data.canvasLayout?: CanvasLayout. When absent, every existing
 * renderer/export path behaves exactly as before (see plan doc).
 */

export type CanvasElementType = 'text' | 'image' | 'shape';

export type ShapeKind = 'rect' | 'ellipse' | 'line';

interface CanvasElementBase {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** Stacking order; higher renders on top. */
  zIndex: number;
}

export interface CanvasTextElement extends CanvasElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface CanvasImageElement extends CanvasElementBase {
  type: 'image';
  /** URL (R2 asset or, as an interim fallback, a data: URL). */
  src: string;
}

export interface CanvasShapeElement extends CanvasElementBase {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement = CanvasTextElement | CanvasImageElement | CanvasShapeElement;

export interface CanvasLayout {
  /** Canvas size in px, Letter-ish at 96dpi by default (816x1056). */
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

export const DEFAULT_CANVAS_WIDTH = 816;
export const DEFAULT_CANVAS_HEIGHT = 1056;

let idCounter = 0;
export function newElementId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

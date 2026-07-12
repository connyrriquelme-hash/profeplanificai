/**
 * Product Renderer — Registry-based router
 *
 * Routes to the appropriate renderer based on product type.
 * Accepts both raw API responses and typed PedagogicalProduct objects.
 * Auto-normalizes raw responses using minimal normalizers.
 */

import React from 'react';
import { ChecklistRenderer } from './renderers/ChecklistRenderer';
import { RubricRenderer } from './renderers/RubricRenderer';
import { ScaleRenderer } from './renderers/ScaleRenderer';
import { TicketRenderer } from './renderers/TicketRenderer';
import { GuideRenderer } from './renderers/GuideRenderer';
import { DUAGuideRenderer } from './renderers/DUAGuideRenderer';
import { ActivityRenderer } from './renderers/ActivityRenderer';
import { ProjectRenderer } from './renderers/ProjectRenderer';
import { ExperimentRenderer } from './renderers/ExperimentRenderer';
import { ThreeTwoOneRenderer } from './renderers/ThreeTwoOneRenderer';
import { GraphicOrganizerRenderer } from './renderers/GraphicOrganizerRenderer';
import { EvaluationRenderer } from './renderers/EvaluationRenderer';
import { GenericProductRenderer } from './renderers/GenericProductRenderer';
import type { PedagogicalProduct } from './types';
import { normalizeProduct } from './normalizers';

// Also support the existing ClassroomScientificNotebook format
import type { ClassroomScientificNotebook } from '../../types/scientificNotebook';
import { ScientificNotebookRenderer } from './renderers/ScientificNotebookRenderer';

/** Renderer component type */
type RendererComponent = React.ComponentType<{ product: PedagogicalProduct; className?: string; style?: React.CSSProperties }>;

/**
 * Registry of renderers keyed by product type.
 * Maps ALL real type values from the backend to their renderers.
 */
const rendererRegistry: Record<string, RendererComponent> = {
  // Checklists
  checklist: ChecklistRenderer,
  lista_cotejo: ChecklistRenderer,

  // Rubrics
  rubrica: RubricRenderer,
  rubrica_formativa: RubricRenderer,

  // Scales
  escala_apreciacion: ScaleRenderer,

  // Tickets
  ticket_salida: TicketRenderer,
  ticket_entrada: TicketRenderer,

  // Guides
  guia_aprendizaje: GuideRenderer,
  guia_estudiante: GuideRenderer,
  guia_docente: GuideRenderer,

  // DUA
  guia_dua: DUAGuideRenderer,

  // Activities
  actividad: ActivityRenderer,
  material_didactico: GenericProductRenderer,

  // Projects
  proyecto: ProjectRenderer,

  // Experiments
  experimento: ExperimentRenderer,

  // 3-2-1 Format
  formato_321: ThreeTwoOneRenderer,

  // Graphic organizers
  organizador_grafico: GraphicOrganizerRenderer,

  // Evaluations
  evaluacion: EvaluationRenderer,
  semaforo: GenericProductRenderer,

  // Scientific notebook
  bitacora_cientifica: GenericProductRenderer,
};

/** Type guard for ClassroomScientificNotebook */
function isClassroomScientificNotebook(
  product: unknown
): product is ClassroomScientificNotebook {
  return (
    typeof product === 'object' &&
    product !== null &&
    'metadata' in product &&
    'materials' in product &&
    'procedure' in product &&
    'assessment' in product
  );
}

/** Type guard for PedagogicalProduct */
function isPedagogicalProduct(
  product: unknown
): product is PedagogicalProduct {
  return (
    typeof product === 'object' &&
    product !== null &&
    'type' in product &&
    typeof (product as PedagogicalProduct).type === 'string' &&
    'metadata' in product &&
    'data' in product
  );
}

interface ProductRendererProps {
  product: PedagogicalProduct | ClassroomScientificNotebook | unknown;
  selectedProducto?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProductRenderer({ product, selectedProducto, className, style }: ProductRendererProps) {
  // Handle ClassroomScientificNotebook format (existing)
  if (isClassroomScientificNotebook(product)) {
    return <ScientificNotebookRenderer notebook={product} className={className} style={style} />;
  }

  // Handle PedagogicalProduct format (new, already typed)
  if (isPedagogicalProduct(product)) {
    const Renderer = rendererRegistry[product.type];
    if (Renderer) {
      return <Renderer product={product} className={className} style={style} />;
    }
    return <GenericProductRenderer product={product} className={className} style={style} />;
  }

  // Try normalizing raw API response
  const normalized = normalizeProduct(product as Record<string, unknown>, selectedProducto);
  if (normalized) {
    const Renderer = rendererRegistry[normalized.type];
    if (Renderer) {
      return <Renderer product={normalized} className={className} style={style} />;
    }
    return <GenericProductRenderer product={normalized} className={className} style={style} />;
  }

  // Ultimate fallback: try to extract title/data from raw object
  const raw = typeof product === 'object' && product !== null ? product as Record<string, unknown> : null;
  const fallbackProduct: PedagogicalProduct = {
    type: 'material_didactico',
    metadata: {
      title: raw && typeof raw.title === 'string' ? raw.title : 'Producto',
      subtitle: raw && typeof raw.subtitle === 'string' ? raw.subtitle : undefined,
    },
    data: raw || {},
  };
  return <GenericProductRenderer product={fallbackProduct} className={className} style={style} />;
}
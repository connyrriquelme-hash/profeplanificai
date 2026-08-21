/**
 * Product Renderer — Registry-based router
 *
 * Routes to the appropriate renderer based product type.
 * Accepts both raw API responses and typed PedagogicalProduct objects.
 * Auto-normalizes raw responses using minimal normalizers.
 *
 * Supports two view modes:
 *  - "visual": type-specific premium renderers (default)
 *  - "document": Word-like DocumentPreview with AI editing
 */

import React, { useState, useCallback, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { FileText, Layout, Sparkles, Palette, Loader2 } from 'lucide-react';

// Konva/react-konva son pesados (~300KB) y solo los necesita quien entra a
// modo "Diseño"; cargarlos eager infla el chunk de cada vista que use
// ProductRenderer aunque nunca se abra el editor visual.
const ProductCanvasEditor = lazy(() => import('./canvas/ProductCanvasEditor').then(m => ({ default: m.ProductCanvasEditor })));
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
import { PlanificacionRenderer } from './renderers/PlanificacionRenderer';
import { PresentacionRenderer } from './renderers/PresentacionRenderer';
import { UnidadDidacticaRenderer } from './renderers/UnidadDidacticaRenderer';
import { SemaforoRenderer } from './renderers/SemaforoRenderer';
import { ProductActionBar } from './ProductActionBar';
import { DocumentPreview } from './DocumentPreview';
import { AIEditorAssistant } from './AIEditorAssistant';
import type { PedagogicalProduct } from './types';
import { normalizeProduct } from './normalizers';

// Also support the existing ClassroomScientificNotebook format
import type { ClassroomScientificNotebook } from '../../types/scientificNotebook';
import { ScientificNotebookRenderer } from './renderers/ScientificNotebookRenderer';

/** Renderer component type */
type RendererComponent = React.ComponentType<{
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
  onProductChange?: (updated: PedagogicalProduct) => void;
}>;

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
  semaforo: SemaforoRenderer,

  // Scientific notebook
  bitacora_cientifica: GenericProductRenderer,

  // Planificacion
  planificacion: PlanificacionRenderer,

  // Presentacion
  presentacion: PresentacionRenderer,

  // Unidad Didactica
  unidad_didactica: UnidadDidacticaRenderer,
  serie_lecciones: UnidadDidacticaRenderer,
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
  onSave?: () => void;
  resourceId?: string;
  showActionBar?: boolean;
  enableAIEdit?: boolean;
  defaultMode?: 'visual' | 'document' | 'diseno';
  className?: string;
  style?: React.CSSProperties;
}

type ViewMode = 'visual' | 'document' | 'diseno';

const PALETTE = {
  turquoise: '#06BFAD',
  purple: '#7F58A6',
} as const;

export default function ProductRenderer({
  product,
  selectedProducto,
  onSave,
  resourceId,
  showActionBar = true,
  enableAIEdit = true,
  defaultMode = 'visual',
  className,
  style,
}: ProductRendererProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [activeProduct, setActiveProduct] = useState<PedagogicalProduct | null>(() => {
    if (isPedagogicalProduct(product)) return product;
    if (isClassroomScientificNotebook(product)) return null;
    const normalized = normalizeProduct(product as Record<string, unknown>, selectedProducto);
    return normalized;
  });

  const handleProductUpdated = useCallback((updated: PedagogicalProduct, _explanation: string) => {
    setActiveProduct(updated);
  }, []);

  // Resolve the working product
  const workingProduct = activeProduct || (() => {
    if (isPedagogicalProduct(product)) return product;
    if (isClassroomScientificNotebook(product)) return null;
    return normalizeProduct(product as Record<string, unknown>, selectedProducto);
  })();

  const handleInlineEdit = useCallback((updated: PedagogicalProduct) => {
    setActiveProduct(updated);
  }, []);

  const renderVisualMode = () => {
    if (isClassroomScientificNotebook(product)) {
      return <ScientificNotebookRenderer notebook={product} className={className} style={style} />;
    }

    const prod = workingProduct || (isPedagogicalProduct(product) ? product : null);
    if (!prod) return <GenericProductRenderer product={product as PedagogicalProduct} className={className} style={style} />;

    const Renderer = rendererRegistry[prod.type];
    if (Renderer) {
      return <Renderer product={prod} className={className} style={style} onProductChange={handleInlineEdit} />;
    }
    return <GenericProductRenderer product={prod} className={className} style={style} onProductChange={handleInlineEdit} />;
  };

  const renderDocumentMode = () => {
    if (!workingProduct) {
      return (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">No hay producto para mostrar en formato documento</p>
        </div>
      );
    }
    return (
      <DocumentPreview
        product={workingProduct}
        onProductChange={handleInlineEdit}
        className={className}
        style={style}
      />
    );
  };

  const renderDesignMode = () => {
    if (!workingProduct) {
      return (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">No hay producto para diseñar</p>
        </div>
      );
    }
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--ink-mute)]"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando editor de diseño…</div>}>
        <ProductCanvasEditor
          product={workingProduct}
          onProductChange={handleInlineEdit}
          className={className}
        />
      </Suspense>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle + AI edit toggle */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'visual'
                ? 'bg-white text-[var(--ink)] shadow-sm'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('document')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'document'
                ? 'bg-white text-[var(--ink)] shadow-sm'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documento
          </button>
          <button
            type="button"
            onClick={() => setMode('diseno')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'diseno'
                ? 'bg-white text-[var(--ink)] shadow-sm'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Diseño
          </button>
        </div>

        {enableAIEdit && mode === 'document' && workingProduct && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-600">
            <Sparkles className="w-3 h-3" />
            IA habilitada
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className={`flex gap-4 ${mode === 'document' && enableAIEdit ? 'lg:flex-row' : ''}`}>
        {/* Product content */}
        <div className="flex-1 min-w-0">
          {mode === 'visual' && renderVisualMode()}
          {mode === 'document' && renderDocumentMode()}
          {mode === 'diseno' && renderDesignMode()}
        </div>

        {/* AI Editor sidebar — only in document mode */}
        {mode === 'document' && enableAIEdit && workingProduct && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 flex-shrink-0 print:hidden"
          >
            <div className="lg:sticky lg:top-4">
              <AIEditorAssistant
                product={workingProduct}
                resourceId={resourceId}
                onProductUpdated={handleProductUpdated}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Action bar */}
      {showActionBar && workingProduct && (
        <div className="print:hidden">
          <ProductActionBar product={workingProduct} onSave={onSave} />
        </div>
      )}
    </div>
  );
}

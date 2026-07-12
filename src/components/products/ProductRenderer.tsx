/** Product Renderer

Main entry point for rendering student notebook products.
Routes to appropriate renderer based on product type.
*/

import { ScientificNotebookRenderer } from './ScientificNotebookRenderer';
import type { ClassroomScientificNotebook } from '../../types/scientificNotebook';

type SupportedProduct = ClassroomScientificNotebook | { type?: string; [key: string]: unknown };

function isScientificNotebook(
  product: SupportedProduct
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

function hasStringType(
  product: SupportedProduct
): product is SupportedProduct & { type: string } {
  return (
    typeof product === 'object' &&
    product !== null &&
    'type' in product &&
    typeof (product as { type?: unknown }).type === 'string'
  );
}

export default function ProductRenderer({ product }: { product: SupportedProduct }) {
  if (isScientificNotebook(product)) {
    return <ScientificNotebookRenderer notebook={product} />;
  }

  const productType = hasStringType(product) ? product.type : undefined;

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Producto sin vista especializada
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Tipo: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-xs">
                {productType ?? 'desconocido'}
              </code>
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Este producto todavía no tiene una vista especializada.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Tipo detectado: <code className="font-mono">{productType ?? 'desconocido'}</code>
        </p>
      </div>
    </div>
  );
}
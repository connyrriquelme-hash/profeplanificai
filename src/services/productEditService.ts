/**
 * Product Edit Service
 *
 * Client for the /api/materials/edit-product endpoint.
 */

import { api } from './apiClient';
import type { PedagogicalProduct } from '../components/products/types';

export interface EditProductResult {
  ok: boolean;
  productoModificado: PedagogicalProduct;
  explicacion: string;
  camposModificados: string[];
}

export async function editProduct(
  instruccion: string,
  producto: PedagogicalProduct,
  resourceId?: string,
): Promise<EditProductResult> {
  const response = await api.post<EditProductResult>(
    '/api/materials/edit-product',
    { instruccion, producto, resourceId },
  );

  return response;
}

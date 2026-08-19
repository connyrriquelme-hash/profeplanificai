import { z } from 'zod';
import type { AIEngineEnv } from '../../core/types';

export const EditProductResponseSchema = z.object({
  productoModificado: z.record(z.unknown()),
  explicacion: z.string().min(10).max(500),
  camposModificados: z.array(z.string()),
});

export type EditProductResponse = z.infer<typeof EditProductResponseSchema>;

export interface EditProductOptions {
  producto: Record<string, unknown>;
  instruccion: string;
  tipo: string;
  nivel: string;
  asignatura: string;
}

function buildSystemPrompt(): string {
  return `Eres un asistente experto en edicion de productos pedagogicos para profesores chilenos.

Tu tarea es modificar el contenido de un producto educativo segun la instruccion del usuario.

REGLAS ESTRICTAS:
1. Devuelve SOLO el JSON del producto modificado, sin texto adicional
2. Mantén la estructura original del producto (mismas keys, mismos tipos)
3. Aplica SOLO los cambios solicitados — no modifiques nada mas
4. Si el usuario pide eliminar algo, simplemente quitalo del JSON
5. Si el usuario pide agregar algo, insertalo en la posicion logica
6. Si el usuario pide modificar algo, reemplaza solo ese contenido
7. Mantén el tono pedagogico y profesional del contenido original
8. Nunca inventes informacion que no este en el producto original
9. Respeta la longitud y formato del contenido existente
10. El resultado debe ser un JSON valido con la misma estructura de entrada

IMPORTANTE: El campo "explicacion" debe describir CLARAMENTE que cambios se realizaron.
El campo "camposModificados" debe listar los nombres de los campos que fueron modificados.`;
}

function buildUserPrompt(options: EditProductOptions): string {
  const productoStr = JSON.stringify(options.producto, null, 2);

  return `PRODUCTO ACTUAL (${options.tipo}):
Nivel: ${options.nivel}
Asignatura: ${options.asignatura}

CONTENIDO COMPLETO:
${productoStr}

INSTRUCCION DEL USUARIO:
"${options.instruccion}"

Modifica el producto segun la instruccion. Devuelve el JSON completo del producto modificado.`;
}

const FALLBACK_EXPLICACION = 'No se pudo procesar la edicion. El producto se mantiene sin cambios.';

export async function editProduct(
  env: AIEngineEnv,
  options: EditProductOptions,
): Promise<{ producto: Record<string, unknown>; explicacion: string; camposModificados: string[] }> {
  try {
    const { callAIConValidacion } = await import('./AIEngine');

    const { data } = await callAIConValidacion(
      env,
      buildSystemPrompt(),
      buildUserPrompt(options),
      EditProductResponseSchema,
      { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 4000 },
    );

    return {
      producto: data.productoModificado,
      explicacion: data.explicacion,
      camposModificados: data.camposModificados,
    };
  } catch (error) {
    console.error('[EditProductEngine] AI error:', error);
    return {
      producto: options.producto,
      explicacion: FALLBACK_EXPLICACION,
      camposModificados: [],
    };
  }
}

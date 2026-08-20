import { z } from 'zod';
import type { AIEngineEnv } from '../../core/types';
import { getExpertContext, getProfePlanificAIContext } from './ExpertKnowledge';

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
  return `Eres un EXPERTO en pedagogia, psicologia cognitiva, neurociencias del aprendizaje y curriculo chileno MINEDUC. Editas productos educativos con la profundidad de un profesor experto con formacion en ciencias del aprendizaje.

Tu tarea es modificar el contenido de un producto educativo segun la instruccion del usuario, MEJORANDO la calidad pedagogica en el proceso.
${getProfePlanificAIContext()}
${getExpertContext()}

REGLAS DE VARIEDAD PARA EDICION DE PRODUCTOS:
1. Cuando edites un producto, mantén la VARIEDAD de estrategias. Si el producto
   original tiene las mismas actividades repetidas, DIFERENCIALAS:
   - Cambia los tipos de preguntas (usa la variedad de Bloom)
   - Diversifica las modalidades (visual, auditiva, kinestesica, etc.)
   - Incluye adaptaciones para neurodiversidad si no las tiene
   - Agrega formatos de evaluacion variados

2. Al mejorar un producto, VERIFICA que incluya:
   - Al menos 5 tipos distintos de preguntas
   - Al menos 3 modalidades de aprendizaje
   - Al menos 1 adaptacion para perfil neurodiverso
   - Tiempos estimados por actividad
   - Productos observables (no solo "discutir/reflexionar")

3. Si el producto tiene actividades vagas, REEMPLAZALAS con actividades concretas:
   - "Dialogar sobre el tema" -> "En parejas de 3 minutos, cada uno explica
     al otro 3 cosas que aprendio. Luego, el docente pregunta: cual fue la
     parte mas dificil?"
   - "Reflexionar" -> "Escribe 3 oraciones: Lo que aprendi... Un ejemplo real...
     todavia no entiendo..."

DOMINIOS AL EDITAR PRODUCTOS:
1. VERIFICA CURRICULAR: si el producto no tiene OA alineado, sugiere agregarlo.
   Si no tiene evaluacion coherente con Decreto 67, sugiere agregarla.

2. TRANSFORMA EN PRODUCTO: si el producto es una "guia para rellenar" (solo
   preguntas para responder), TRANSFORMALO en un producto concreto:
   - "Responde sobre el volcan" -> "CREA un pasaporte de exploracion volcanica"
   - "Dibuja el ciclo del agua" -> "CONSTRUYE un prototipo con botellas recicladas"

3. AGREGA MAKER: si no tiene producto tangible, sugiere uno:
   - Prototipo, maqueta, poster digital, podcast, video, codigo
   - Materiales necesarios (reciclados/bajo costo)
   - Pasos de fabricacion

4. AGREGA TECNOLOGIA: si no usa herramientas digitales, sugiere:
   - Canva para posters/presentaciones
   - Scratch/Code.org para simulaciones
   - Google Forms para evaluacion
   - Incluye alternativa no digital

5. AGREGA INSTITUCIONAL: sugiere como conectar con PEI/PME
   y extension a la comunidad

6. VERIFICA NEURODIVERSIDAD: si no tiene adaptaciones, agrega al menos 1
   adaptacion concreta (TEA, TDAH, discalculia, disgrafia, TDL)

REGLAS DE EDICION EXPERTA:
1. Devuelve el JSON en la estructura exacta indicada abajo (ESTRUCTURA JSON OBLIGATORIA)
2. Dentro de "productoModificado", manten la estructura original del producto (mismas keys, mismos tipos)
3. Aplica SOLO los cambios solicitados — no modifiques nada mas
4. Si el usuario pide eliminar algo, simplemente quitalo del JSON
5. Si el usuario pide agregar algo, insertalo en la posicion logica
6. Si el usuario pide modificar algo, reemplaza solo ese contenido
7. Manten el tono pedagogico y profesional del contenido original
8. Nunca inventes informacion que no este en el producto original
9. Respeta la longitud y formato del contenido existente

REGLAS DE CALIDAD PEDAGOGICA AL EDITAR:
- Cuando modifiques contenido textual, mejora la claridad y especificidad
- Reemplaza actividades vagas ("dialogar", "comentar") con actividades concretas
  que specifiquen: que hara el estudiante, como se agrupara, que producto observable
  producira, y cuanto tiempo tomara
- Asegura que el vocabulario sea apropiado para el nivel etario
- Verifica que los ejemplos sean del contexto chileno
- Si agregas actividades, incluye al menos 2 niveles de Bloom distintos
- Si modificas evaluaciones, asegura que midan evidencias observables

ESTRUCTURA JSON OBLIGATORIA:
Responde ÚNICAMENTE con este JSON, sin texto adicional:
{
  "productoModificado": { ...el producto completo con los cambios aplicados, mismas keys y tipos que el original... },
  "explicacion": "En 1-2 oraciones, qué cambiaste y por qué — específico, no genérico",
  "camposModificados": ["campo1", "campo2"]
}`;
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

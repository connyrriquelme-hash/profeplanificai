import { z } from 'zod';

/**
 * Contrato de IA para el copilot conversacional (Fase 1 —
 * functions/api/copilot/chat.ts). A diferencia de los engines de
 * generación de productos (GuiaEngine, RubricaEngine, etc.), este
 * schema no describe un producto pedagógico: describe la respuesta
 * de un turno de chat, incluyendo qué intención detectó la IA y qué
 * acciones (herramientas) propone ejecutar. El endpoint decide si
 * ejecuta esas acciones según `requiresConfirmation` y si la
 * herramienta es de solo lectura (ver TOOL_REGISTRY en chat.ts).
 */

export const CopilotIntentSchema = z.enum([
  'search_curriculum',
  'generate_material',
  'edit_material',
  'save_to_bank',
  'list_resources',
  'navigate_to_view',
  'answer_question',
  'clarify',
]);

export const CopilotActionSchema = z.object({
  tool: z.string().min(1, 'El nombre de la herramienta no puede estar vacío'),
  arguments: z.record(z.unknown()),
});

export const CopilotCitationSchema = z.object({
  source: z.string().min(1),
  label: z.string().min(1),
});

export const CopilotResponseSchema = z.object({
  message: z.string().min(1, 'El mensaje para el profesor no puede estar vacío'),
  intent: CopilotIntentSchema,
  requiresConfirmation: z.boolean(),
  actions: z.array(CopilotActionSchema),
  citations: z.array(CopilotCitationSchema).optional(),
});

export type CopilotIntent = z.infer<typeof CopilotIntentSchema>;
export type CopilotAction = z.infer<typeof CopilotActionSchema>;
export type CopilotCitation = z.infer<typeof CopilotCitationSchema>;
export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;

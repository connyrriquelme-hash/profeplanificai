/**
 * Agent Types — Base interfaces for pedagogical agents
 */

export interface AgentContext {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  attitudes?: string[];
  methodology?: string;
  topic?: string;
  additionalContext?: string;
  duration?: string;
  studentCount?: number;
  designStyle?: string;
}

export interface AgentResponse {
  ok: boolean;
  agentName: string;
  content: any;
  curriculumContext: AgentContext;
  metadata?: {
    tokensUsed?: number;
    durationMs?: number;
    aiProvider?: string;
    aiModel?: string;
  };
  error?: string;
}

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  requiresContext: boolean;
  outputFormat: string;
}

export abstract class PedagogicalAgent {
  abstract name: string;
  abstract description: string;
  abstract systemPrompt: string;

  abstract execute(context: AgentContext, input?: any): Promise<AgentResponse>;

  protected buildContextPrompt(context: AgentContext): string {
    return [
      `Nivel: ${context.level}`,
      `Asignatura: ${context.subject}`,
      `OA: ${context.objectiveCode} — ${context.objectiveText}`,
      context.indicators?.length ? `Indicadores: ${context.indicators.join('; ')}` : '',
      context.skills?.length ? `Habilidades: ${context.skills.join('; ')}` : '',
      context.attitudes?.length ? `Actitudes: ${context.attitudes.join('; ')}` : '',
      context.methodology ? `Metodología: ${context.methodology}` : '',
      context.topic ? `Tema: ${context.topic}` : '',
      context.additionalContext ? `Contexto: ${context.additionalContext}` : '',
      context.duration ? `Duración: ${context.duration}` : '',
      context.studentCount ? `Estudiantes: ${context.studentCount}` : '',
    ].filter(Boolean).join('\n');
  }

  protected createResponse(content: any, context: AgentContext, metadata?: AgentResponse['metadata']): AgentResponse {
    return {
      ok: true,
      agentName: this.name,
      content,
      curriculumContext: context,
      metadata,
    };
  }

  protected createError(error: string, context: AgentContext): AgentResponse {
    return {
      ok: false,
      agentName: this.name,
      content: null,
      curriculumContext: context,
      error,
    };
  }
}

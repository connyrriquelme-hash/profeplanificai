/**
 * DocenteChilenoOrchestrator — Coordinates pedagogical agents
 * Ensures curriculum context is retrieved before any generation
 */

import { type AgentContext, type AgentResponse } from './types';
import { CurriculumChileAgent } from './CurriculumChileAgent';
import { MethodologyAgent } from './MethodologyAgent';
import { PlanningAgent } from './PlanningAgent';
import { AssessmentAgent } from './AssessmentAgent';
import { MaterialsAgent } from './MaterialsAgent';
import { PresentationAgent } from './PresentationAgent';
import { DUAInclusionAgent } from './DUAInclusionAgent';
import { SimceAgent } from './SimceAgent';
import { ReflectionReportAgent } from './ReflectionReportAgent';

const AGENTS = {
  curriculum: new CurriculumChileAgent(),
  methodology: new MethodologyAgent(),
  planning: new PlanningAgent(),
  assessment: new AssessmentAgent(),
  materials: new MaterialsAgent(),
  presentation: new PresentationAgent(),
  dua: new DUAInclusionAgent(),
  simce: new SimceAgent(),
  reflection: new ReflectionReportAgent(),
};

export type AgentName = keyof typeof AGENTS;

export interface OrchestrateRequest {
  agent: AgentName;
  context: AgentContext;
  input?: any;
}

export async function executeAgent(req: OrchestrateRequest): Promise<AgentResponse> {
  const agent = AGENTS[req.agent];
  if (!agent) {
    return {
      ok: false,
      agentName: req.agent,
      content: null,
      curriculumContext: req.context,
      error: `Agente "${req.agent}" no encontrado. Disponibles: ${Object.keys(AGENTS).join(', ')}`,
    };
  }

  // Rule: No agent can generate without curriculum context
  // If context is incomplete, try to enrich it first
  if (!req.context.objectiveCode || !req.context.objectiveText) {
    return {
      ok: false,
      agentName: req.agent,
      content: null,
      curriculumContext: req.context,
      error: 'Se requiere objectiveCode y objectiveText para generar contenido curricular.',
    };
  }

  const startTime = Date.now();

  try {
    const response = await agent.execute(req.context, req.input);
    const duration = Date.now() - startTime;

    return {
      ...response,
      metadata: {
        ...response.metadata,
        durationMs: duration,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      agentName: req.agent,
      content: null,
      curriculumContext: req.context,
      error: err.message || 'Error desconocido',
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

export function listAgents(): Array<{ name: string; description: string }> {
  return Object.values(AGENTS).map(a => ({ name: a.name, description: a.description }));
}

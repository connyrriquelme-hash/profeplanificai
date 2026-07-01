/**
 * Agent index — exports all agents and orchestrator
 */

export { PedagogicalAgent } from './types';
export type { AgentContext, AgentResponse, AgentConfig } from './types';

export { CurriculumChileAgent } from './CurriculumChileAgent';
export { MethodologyAgent } from './MethodologyAgent';
export { PlanningAgent } from './PlanningAgent';
export { AssessmentAgent } from './AssessmentAgent';
export { MaterialsAgent } from './MaterialsAgent';
export { PresentationAgent } from './PresentationAgent';
export { DUAInclusionAgent } from './DUAInclusionAgent';
export { SimceAgent } from './SimceAgent';
export { ReflectionReportAgent } from './ReflectionReportAgent';

export { executeAgent, listAgents } from './DocenteChilenoOrchestrator';
export type { AgentName, OrchestrateRequest } from './DocenteChilenoOrchestrator';

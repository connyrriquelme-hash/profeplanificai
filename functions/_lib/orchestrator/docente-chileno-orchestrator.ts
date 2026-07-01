import type { Env } from '../_middleware';

export interface AgentTask {
  id: string;
  agent_name: string;
  task_type: 'generate' | 'search' | 'enrich' | 'analyze' | 'retrieve';
  parameters: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  attempts: number;
  max_attempts: number;
  result?: any;
  error?: string;
}

export interface AgentContext {
  user_id: string;
  permissions: string[];
  curriculum_enrichment?: any;
  current_tasks: AgentTask[];
  active_agents: string[];
}

export class DocenteChilenoOrchestrator {
  private env: Env;
  private contexts: Map<string, AgentContext>; // user_id -> context

  constructor(env: Env) {
    this.env = env;
    this.contexts = new Map();
  }

  async createTask(
    userId: string,
    agentName: string,
    taskType: AgentTask['task_type'],
    parameters: any,
    priority: AgentTask['priority'] = 'normal'
  ): Promise<AgentTask> {
    const taskId = `task-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const context = this.getUserContext(userId);
    context.active_agents.add(agentName);

    const task: AgentTask = {
      id: taskId,
      agent_name: agentName,
      task_type: taskType,
      parameters,
      priority,
      status: 'pending',
      created_at: now,
      attempts: 0,
      max_attempts: 3,
    };

    context.current_tasks.push(task);

    await this.saveTaskToD1(task);

    return task;
  }

  async processTask(taskId: string, userId: string): Promise<AgentTask> {
    const context = this.getUserContext(userId);
    const task = context.current_tasks.find(t => t.id === taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'pending') {
      throw new Error(`Task already processed: ${taskId}`);
    }

    task.status = 'running';
    task.started_at = new Date().toISOString();

    await this.updateTaskInD1(task);

    try {
      let result: any;

      switch (task.agent_name) {
        case 'curriculum':
          result = await this.processCurriculumTask(task);
          break;
        case 'methodology':
          result = await this.processMethodologyTask(task);
          break;
        case 'planning':
          result = await this.processPlanningTask(task);
          break;
        case 'biblioteca':
          result = await this.processBibliotecaTask(task);
          break;
        case 'slide':
          result = await this.processSlideTask(task);
          break;
        case 'docente':
          result = await this.processDocenteTask(task);
          break;
        case 'search':
          result = await this.processSearchTask(task);
          break;
        default:
          throw new Error(`Unknown agent: ${task.agent_name}`);
      }

      task.status = 'completed';
      task.result = result;

      context.active_agents.delete(task.agent_name);

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.attempts++;

      if (task.attempts >= task.max_attempts) {
        task.status = 'cancelled';
        context.active_agents.delete(task.agent_name);
      }

      await this.updateTaskInD1(task);
      throw error;
    }

    task.completed_at = new Date().toISOString();

    await this.updateTaskInD1(task);

    return task;
  }

  private getUserContext(userId: string): AgentContext {
    if (!this.contexts.has(userId)) {
      const context: AgentContext = {
        user_id: userId,
        permissions: [],
        current_tasks: [],
        active_agents: [],
      };
      this.contexts.set(userId, context);
    }
    return this.contexts.get(userId)!;
  }

  private async saveTaskToD1(task: AgentTask): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO agent_runs (
        id, agent_name, user_id, input_json, context_json,
        output_json, duration_ms, tokens_used, status, error_message,
        curriculum_context_json, ai_provider, ai_model, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      task.id,
      task.agent_name,
      task.id, // temporary user_id for now
      JSON.stringify(task.parameters),
      JSON.stringify({}),
      JSON.stringify(task.result || {}),
      0, // duration_ms (placeholder)
      0, // tokens_used (placeholder)
      task.status,
      task.error || null,
      JSON.stringify(task.result || {}), // curriculum_context_json
      'gemini', // ai_provider (placeholder)
      'gemini-2.0-flash', // ai_model (placeholder)
      task.created_at,
      new Date().toISOString()
    ).run();
  }

  private async updateTaskInD1(task: AgentTask): Promise<void> {
    const now = new Date().toISOString();

    await this.env.DB.prepare(
      `UPDATE agent_runs 
       SET status = ?, output_json = ?, error_message = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      task.status,
      task.result ? JSON.stringify(task.result) : '{}',
      task.error || null,
      now,
      task.id
    ).run();
  }

  private async processCurriculumTask(task: AgentTask): Promise<any> {
    const { objectives } = task.parameters;

    const enriched = [];
    for (const objectiveId of objectives) {
      const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/curriculum/objectives/${objectiveId}`);
      const enrichedObjective = await result.json();
      enriched.push(enrichedObjective);
    }

    return {
      objectives: enriched,
      count: enriched.length,
      processed_at: new Date().toISOString(),
    };
  }

  private async processMethodologyTask(task: AgentTask): Promise<any> {
    const { subjectId, level } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/methodologies?subject=${encodeURIComponent(subjectId)}&level=${encodeURIComponent(level)}`);
    const methodologies = await result.json();

    return {
      methodologies,
      subjectId,
      level,
      count: methodologies.length,
      processed_at: new Date().toISOString(),
    };
  }

  private async processPlanningTask(task: AgentTask): Promise<any> {
    const { userId, objectiveId, methodologyId, templateId, type } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/materials/planning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, objectiveId, methodologyId, templateId, type }),
    });

    if (!result.ok) {
      throw new Error(`Planning failed: ${result.status} ${await result.text()}`);
    }

    const planningResult = await result.json();

    return {
      planning: planningResult,
      userId,
      objectiveId,
      processed_at: new Date().toISOString(),
    };
  }

  private async processBibliotecaTask(task: AgentTask): Promise<any> {
    const { userId, objectiveId } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/materials/guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, objectiveId }),
    });

    if (!result.ok) {
      throw new Error(`Biblioteca generation failed: ${result.status} ${await result.text()}`);
    }

    const guideResult = await result.json();

    return {
      guide: guideResult,
      userId,
      objectiveId,
      processed_at: new Date().toISOString(),
    };
  }

  private async processSlideTask(task: AgentTask): Promise<any> {
    const { resourceId, userId, numSlides = 15, type = 'lesson' } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/materials/presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, userId, numSlides, type }),
    });

    if (!result.ok) {
      throw new Error(`Slide generation failed: ${result.status} ${await result.text()}`);
    }

    const presentationResult = await result.json();

    return {
      presentation: presentationResult,
      resourceId,
      userId,
      processed_at: new Date().toISOString(),
    };
  }

  private async processDocenteTask(task: AgentTask): Promise<any> {
    const { userId, courseId } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/docente/courses/${courseId}/students`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!result.ok) {
      throw new Error(`Docente data retrieval failed: ${result.status} ${await result.text()}`);
    }

    const students = await result.json();

    return {
      students,
      courseId,
      userId,
      processed_at: new Date().toISOString(),
    };
  }

  private async processSearchTask(task: AgentTask): Promise<any> {
    const { query, filters } = task.parameters;

    const result = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/curriculum/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!result.ok) {
      throw new Error(`Search failed: ${result.status} ${await result.text()}`);
    }

    const searchResults = await result.json();

    return {
      results: searchResults,
      query,
      filters,
      count: searchResults.length,
      processed_at: new Date().toISOString(),
    };
  }

  async getUserTasks(userId: string): Promise<AgentTask[]> {
    const context = this.getUserContext(userId);
    return context.current_tasks;
  }

  async getActiveAgents(userId: string): Promise<string[]> {
    const context = this.getUserContext(userId);
    return Array.from(context.active_agents);
  }

  async cleanupCompletedTasks(userId: string): Promise<void> {
    const context = this.getUserContext(userId);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    context.current_tasks = context.current_tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        const taskDate = new Date(task.created_at);
        return taskDate > oneDayAgo;
      }
      return true;
    });

    context.active_agents = new Set(context.active_agents.filter(agent => {
      return context.current_tasks.some(task => task.agent_name === agent && task.status === 'running');
    }));
  }
}
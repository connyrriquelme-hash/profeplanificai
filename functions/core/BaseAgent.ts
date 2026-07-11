import type { ContextEngineConfig, PedagogicalContext } from './ContextEngine';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt: string;
  response_schema: Record<string, any>;
  post_processors?: Array<(content: any) => Promise<any>>;
  validators?: Array<(content: any) => { valid: boolean; errors: string[] }>;
}

export interface GenerationResult<T = any> {
  content: any;
  metadata: {
    agent: string;
    timestamp: string;
    tokens_used: number;
    confidence: number;
    warnings: string[];
    quality_score: number;
  };
  validation: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface BaseAgentConfig {
  env: any;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  validators?: Array<(content: any) => { valid: boolean; errors: string[] }>;
  postProcessors?: Array<(content: any) => Promise<any>>;
}

export abstract class BaseAgent<T = any> {
  protected env: any;
  protected systemPrompt: string;
  protected model: string;
  protected temperature: number;
  protected maxTokens: number;
  protected validators: Array<(content: any) => { valid: boolean; errors: string[] }>;
  protected postProcessors: Array<(content: any) => Promise<any>>;
  protected contextEngine: any = null;

  constructor(config: BaseAgentConfig) {
    this.env = config.env;
    this.systemPrompt = config.systemPrompt;
    this.model = config.model || '@cf/meta/llama-3.2-3b-instruct';
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 4000;
    this.validators = config.validators || [];
    this.postProcessors = config.postProcessors || [];
  }

  setContextEngine(engine: any) {
    this.contextEngine = engine;
  }

  abstract buildPrompt(context: any, params: any): string;

  async generate(context: any, params: any): Promise<GenerationResult<T>> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(context, params);

    try {
      const rawResponse = await this.callAI(prompt);
      const parsed = this.parseResponse(rawResponse);
      const validated = await this.validate(parsed);
      const processed = await this.postProcess(validated);
      const reviewed = await this.review(processed);

      return {
        content: reviewed,
        metadata: {
          agent: this.constructor.name,
          timestamp: new Date().toISOString(),
          tokens_used: 0,
          confidence: this.calculateConfidence(reviewed),
          warnings: [],
          quality_score: this.calculateQuality(reviewed)
        },
        validation: {
          passed: true,
          errors: [],
          warnings: []
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        console.warn(`[${this.constructor.name}] Error: ${errorMessage}`);
      }

      return {
        content: null,
        metadata: {
          agent: this.constructor.name,
          timestamp: new Date().toISOString(),
          tokens_used: 0,
          confidence: 0,
          warnings: [errorMessage],
          quality_score: 0
        },
        validation: {
          passed: false,
          errors: [errorMessage],
          warnings: []
        }
      };
    }
  }

  protected async callAI(prompt: string): Promise<string> {
    if (!this.env.AI) {
      throw new Error('AI no está configurado en el entorno.');
    }

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    const response = await this.env.AI.run(this.model, {
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return typeof response === 'string' ? response : JSON.stringify(response);
  }

  protected parseResponse(raw: string): any {
    let candidate = raw.trim();
    const mdMatch = candidate.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (mdMatch?.[1]) {
      candidate = mdMatch[1].trim();
    }
    const jsonStart = candidate.indexOf('{');
    const jsonEnd = candidate.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      candidate = candidate.substring(jsonStart, jsonEnd + 1);
    }
    return JSON.parse(candidate);
  }

  protected async validate(content: any): Promise<any> {
    for (const validator of this.validators) {
      const result = validator(content);
      if (!result.valid) {
        throw new Error(`Validación fallida: ${result.errors.join(', ')}`);
      }
    }
    return content;
  }

  protected async postProcess(content: any): Promise<any> {
    let result = content;
    for (const processor of this.postProcessors) {
      result = await processor(result);
    }
    return result;
  }

  protected async review(content: any): Promise<any> {
    return content;
  }

  protected calculateConfidence(content: any): number {
    return 0.8;
  }

  protected calculateQuality(content: any): number {
    return 0.8;
  }
}
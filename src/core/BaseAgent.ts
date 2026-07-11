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

export abstract class BaseAgent<T = any> {
  protected env: any;
  protected config: any;
  protected context_engine: any = null;

  constructor(env: any, config: any) {
    this.env = env;
    this.config = config;
  }

  setContextEngine(engine: any) {
    this.context_engine = engine;
  }

  abstract buildPrompt(context: any, params: any): string;

  async generate(context: any, params: any): Promise<any> {
    const start_time = Date.now();
    const prompt = this.buildPrompt(context, params);
    
    try {
      const raw_response = await this.callAI(prompt);
      const parsed = this.parseResponse(raw_response);
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
      return {
        content: null,
        metadata: {
          agent: this.constructor.name,
          timestamp: new Date().toISOString(),
          tokens_used: 0,
          confidence: 0,
          warnings: [String(error)],
          quality_score: 0
        },
        validation: {
          passed: false,
          errors: [String(error)],
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
      { role: 'system' as const, content: this.config.system_prompt },
      { role: 'user' as const, content: prompt }
    ];

    const response = await this.env.AI.run(this.config.model || '@cf/meta/llama-3.2-3b-instruct', {
      messages,
      temperature: this.config.temperature || 0.3,
      max_tokens: this.config.max_tokens || 4000,
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
    if (this.config.validators) {
      for (const validator of this.config.validators) {
        const result = validator(content);
        if (!result.valid) {
          throw new Error(`Validación fallida: ${result.errors.join(', ')}`);
        }
      }
    }
    return content;
  }

  protected async postProcess(content: any): Promise<any> {
    if (this.config.post_processors) {
      let result = content;
      for (const processor of this.config.post_processors) {
        result = await processor(result);
      }
      return result;
    }
    return content;
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
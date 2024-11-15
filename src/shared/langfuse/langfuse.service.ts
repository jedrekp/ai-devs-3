import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Langfuse, { LangfuseGenerationClient, LangfuseTraceClient } from 'langfuse';

@Injectable()
export class LangfuseService {
  private readonly client: Langfuse;

  constructor(configService: ConfigService) {
    this.client = new Langfuse({
      secretKey: configService.get<string>('LANGFUSE_SECRET_KEY'),
      publicKey: configService.get<string>('LANGFUSE_PUBLIC_KEY'),
      baseUrl: configService.get<string>('LANGFUSE_HOST')
    });

    this.client.on('error', (error: Error) => {
      console.error('Langfuse error:', error);
    });
  }

  async getCompiledPrompt(name: string, variables?: Record<string, string>): Promise<string> {
    const prompt = await this.client.getPrompt(name);
    return prompt.compile(variables);
  }

  createGeneration(name: string, input: unknown, trace?: LangfuseTraceClient): LangfuseGenerationClient {
    const body = {
      name,
      input: typeof input === 'string' ? input : JSON.stringify(input)
    };
    return trace ? trace.generation(body) : this.client.generation(body);
  }

  finalizeGeneration(
    generation: LangfuseGenerationClient,
    output: unknown,
    model: string,
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }
  ): void {
    generation.update({
      output: typeof output === 'string' ? output : JSON.stringify(output),
      model,
      usage
    });
    generation.end();
    this.client.flushAsync();
  }
}

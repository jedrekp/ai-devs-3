import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Langfuse, { LangfuseGenerationClient } from 'langfuse';

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

  createGeneration(name: string, input: unknown): LangfuseGenerationClient {
    return this.client.generation({
      name,
      input: JSON.stringify(input)
    });
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

import { Injectable } from '@nestjs/common';
import { LangfuseTraceClient } from 'langfuse';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatModel } from 'openai/resources';
import { LangfuseService } from '../langfuse/langfuse.service';

@Injectable()
export class OpenaiService {
  private client: OpenAI;
  constructor(private readonly langfuseService: LangfuseService) {
    this.client = new OpenAI();
  }

  async singleQuery(
    title: string,
    userQuery: string,
    settings?: {
      systemPrompt?: string;
      model?: ChatModel;
      trace?: LangfuseTraceClient;
    }
  ): Promise<string> {
    const model = settings?.model ?? 'gpt-4';
    const messages: Array<ChatCompletionMessageParam> = [
      { role: 'system', content: settings?.systemPrompt ?? '' },
      { role: 'user', content: userQuery }
    ];

    const generation = this.langfuseService.createGeneration(title, messages, settings?.trace);

    const result = await this.client.chat.completions.create({
      messages,
      model
    });

    const assistantResponse = result.choices[0].message.content;

    this.langfuseService.finalizeGeneration(generation, assistantResponse, model, {
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
      totalTokens: result.usage?.total_tokens
    });

    return assistantResponse;
  }
}

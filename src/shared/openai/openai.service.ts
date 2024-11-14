import { Injectable } from '@nestjs/common';
import { LangfuseTraceClient } from 'langfuse';
import OpenAI, { toFile } from 'openai';
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
      jsonMode?: boolean;
    }
  ): Promise<string> {
    const model = settings?.model ?? 'gpt-4o';
    const messages: Array<ChatCompletionMessageParam> = [
      { role: 'system', content: settings?.systemPrompt ?? '' },
      { role: 'user', content: userQuery }
    ];

    const generation = this.langfuseService.createGeneration(title, messages, settings?.trace);

    const result = await this.client.chat.completions.create({
      messages,
      model,
      ...(settings.jsonMode && { response_format: { type: 'json_object' } })
    });

    const agentResponse = result.choices[0].message.content;

    this.langfuseService.finalizeGeneration(generation, agentResponse, model, {
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
      totalTokens: result.usage?.total_tokens
    });

    return agentResponse;
  }

  async transcribe(
    name: string,
    audioBuffer: Buffer,
    fileExtension: string,
    settings?: {
      description?: string;
      language?: string;
      model?: ChatModel;
      trace?: LangfuseTraceClient;
    }
  ): Promise<string> {
    const model = settings?.model ?? 'whisper-1';
    const language = settings?.language ?? 'pl';
    const generation = this.langfuseService.createGeneration(name, settings?.description ?? name, settings?.trace);

    const result = await this.client.audio.transcriptions.create({
      file: await toFile(audioBuffer, `${name}.${fileExtension}`),
      language,
      model
    });
    const transcription = result.text;

    this.langfuseService.finalizeGeneration(generation, transcription, model, {});

    return transcription;
  }
}

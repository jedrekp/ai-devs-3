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
      fineTunedModel?: string;
      model?: ChatModel;
      trace?: LangfuseTraceClient;
      jsonMode?: boolean;
      temperature?: number;
    }
  ): Promise<string> {
    const model = settings.fineTunedModel ?? settings?.model ?? 'gpt-4o';
    const messages: Array<ChatCompletionMessageParam> = [
      { role: 'system', content: settings?.systemPrompt ?? '' },
      { role: 'user', content: userQuery }
    ];

    const generation = this.langfuseService.createGeneration(title, messages, settings?.trace);

    const result = await this.client.chat.completions.create({
      messages,
      model,
      temperature: settings.temperature ?? 1.0,
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

  async singleImageQuery(
    title: string,
    base64EncodedImage: string,
    fileExtension: string,
    settings?: {
      systemPrompt?: string;
      textContent?: string;
      model?: ChatModel;
      trace?: LangfuseTraceClient;
      jsonMode?: boolean;
      detail?: 'high' | 'auto' | 'low';
      temperature?: number;
    }
  ): Promise<string> {
    const model = settings?.model ?? 'gpt-4o';
    const messages: Array<ChatCompletionMessageParam> = [
      { role: 'system', content: settings?.systemPrompt ?? '' },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/${fileExtension};base64,${base64EncodedImage}`,
              detail: settings?.detail ?? 'auto'
            }
          },
          ...(settings?.textContent
            ? [
                {
                  type: 'text' as const,
                  text: settings.textContent
                }
              ]
            : [])
        ]
      }
    ];

    const generation = this.langfuseService.createGeneration(title, messages, settings?.trace);

    const result = await this.client.chat.completions.create({
      messages,
      model,
      temperature: settings.temperature ?? 1.0,
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
    const generation = this.langfuseService.createGeneration(name, settings?.description ?? name, settings?.trace);

    const result = await this.client.audio.transcriptions.create({
      file: await toFile(audioBuffer, `${name}.${fileExtension}`),
      model,
      ...(settings?.language && { language: settings.language })
    });
    const transcription = result.text;

    this.langfuseService.finalizeGeneration(generation, transcription, model, {});

    return transcription;
  }

  async generateImage(
    title: string,
    imageDescription: string,
    settings?: { model?: ChatModel; trace?: LangfuseTraceClient }
  ): Promise<string> {
    const model = settings?.model ?? 'dall-e-3';
    const generation = this.langfuseService.createGeneration(title, imageDescription, settings?.trace);

    const response = await this.client.images.generate({
      model,
      prompt: imageDescription,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const imageUrl = response.data[0].url;

    this.langfuseService.finalizeGeneration(generation, imageUrl, model, {});

    return response.data[0].url;
  }

  async createEmbedding(
    title: string,
    input: string,
    settings?: {
      model?: ChatModel;
      trace?: LangfuseTraceClient;
      dimensions?: number;
    }
  ) {
    const model = settings?.model ?? 'text-embedding-3-large';
    const generation = this.langfuseService.createGeneration(title, input, settings?.trace);

    const response = await this.client.embeddings.create({
      model,
      input,
      dimensions: settings?.dimensions ?? 1024
    });

    const embedding = response.data[0].embedding;

    this.langfuseService.finalizeGeneration(generation, embedding, model, {
      promptTokens: response.usage?.prompt_tokens,
      totalTokens: response.usage?.total_tokens
    });

    return embedding;
  }
}

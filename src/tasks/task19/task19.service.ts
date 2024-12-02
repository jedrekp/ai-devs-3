import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task19Service {
  private readonly taskName = 'webhook';
  private readonly droneMovementPromptName = 'DRONE_MOVEMENT';
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;
  private readonly task19WebhookUrl: string;
  private task19Board = {
    0: {
      0: 'start',
      1: 'łąka',
      2: 'łąka',
      3: 'góry'
    },
    1: {
      0: 'łąka',
      1: 'wiatrak',
      2: 'łąka',
      3: 'góry'
    },
    2: {
      0: 'drzewo',
      1: 'łąka',
      2: 'skały',
      3: 'auto'
    },
    3: {
      0: 'dom',
      1: 'łąka',
      2: 'dwa drzewa',
      3: 'jaskinia'
    }
  };

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
    this.task19WebhookUrl = configService.get<string>('TASK_19_WEBHOOK_URL');
  }

  async executeTask19(): Promise<{ code: number; message: string }> {
    return this.http.post(this.reportUrl, {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: this.task19WebhookUrl
    });
  }

  async executeTask19Webhook(instruction: string): Promise<{ description: string }> {
    const droneMovementPrompt = await this.langfuseService.getCompiledPrompt(this.droneMovementPromptName);

    const trace = this.langfuseService.createTrace(this.taskName, { input: instruction });

    const agentResponse = await this.openaiService.singleQuery(instruction.slice(0, 20), instruction, {
      systemPrompt: droneMovementPrompt,
      trace,
      jsonMode: true
    });

    const parsedResponse: { h: number; v: number } = JSON.parse(agentResponse);

    const resolvedTask = { description: this.task19Board[parsedResponse.h]?.[parsedResponse.v] ?? 'error' };

    this.langfuseService.finalizeTrace(trace, { output: resolvedTask });

    return resolvedTask;
  }
}

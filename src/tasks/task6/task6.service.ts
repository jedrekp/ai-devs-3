import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task6Service {
  private readonly taskName = 'mp3';
  private readonly inputFileExtension = 'm4a';
  private task6AssetsDirectory = join(__dirname, '..', '..', '..', 'assets', 'task6');
  private readonly interrogatees = ['adam', 'agnieszka', 'ardian', 'michal', 'monika', 'rafal'];
  private readonly contextBasedAnswerPromptName = 'CONTEXT_BASED_SINGLE_QUESTION_ANSWER';
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;

  private readonly transcriptionsCache: Map<string, string>;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
    this.transcriptionsCache = new Map<string, string>();
  }

  async executeTask6(userQuery: string): Promise<{ code: number; message: string }> {
    const trace = this.langfuseService.createTrace(this.taskName);

    const transcriptions: { name: string; transcription: string }[] = await Promise.all(
      this.interrogatees.map(async name => {
        const cachedTranscription: string = this.transcriptionsCache.get(name);
        if (cachedTranscription) return { name, transcription: cachedTranscription };

        const filePath = join(this.task6AssetsDirectory, `${name}.${this.inputFileExtension}`);
        const fileBuffer = await fs.readFile(filePath);
        const transcription = await this.openaiService.transcribe(
          `Transcription: ${name}`,
          fileBuffer,
          this.inputFileExtension,
          {
            description: name,
            language: 'pl',
            trace
          }
        );

        this.transcriptionsCache.set(name, transcription);

        return { name, transcription };
      })
    );

    const context = transcriptions.map(data => `${data.name}:\n${data.transcription}`).join('\n\n');
    const agentResponse = await this.openaiService.singleQuery('Context based JSON answer', userQuery, {
      systemPrompt: await this.langfuseService.getCompiledPrompt(this.contextBasedAnswerPromptName, { context }),
      jsonMode: true,
      trace
    });

    this.langfuseService.finalizeTrace(trace);

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: JSON.parse(agentResponse).answer
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

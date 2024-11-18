import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task8Service {
  private readonly taskName = 'robotid';
  private readonly centralaAgentsApiKey: string;
  private readonly inputDataUrl: string;
  private readonly reportUrl: string;
  private readonly generateImagePromptName = 'IMAGE_GENERATION_INPUT_DATA';

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.inputDataUrl = `${centralaAgentsApiUrl}/data/${this.centralaAgentsApiKey}/robotid.json`;
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask8() {
    const inputData: { description: string } = await this.http.get(this.inputDataUrl);

    const trace = this.langfuseService.createTrace(this.taskName);

    const imageDescription = await this.openaiService.singleQuery(
      'Image generation input data',
      inputData.description,
      {
        systemPrompt: await this.langfuseService.getCompiledPrompt(this.generateImagePromptName),
        trace
      }
    );
    const imageUrl = await this.openaiService.generateImage('Generate image', imageDescription, { trace });

    this.langfuseService.finalizeTrace(trace);

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: imageUrl
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

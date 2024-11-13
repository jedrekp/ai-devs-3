import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { censorshipPrompt } from './task5.prompt';

@Injectable()
export class Task5Service {
  private readonly taskName = 'CENZURA';
  private readonly centralaAgentsApiKey: string;
  private readonly inputDataUrl: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.inputDataUrl = `${centralaAgentsApiUrl}/data/${this.centralaAgentsApiKey}/cenzura.txt`;
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask5(): Promise<{ code: number; message: string }> {
    const inputData: string = await this.http.get(this.inputDataUrl);

    const censored = await this.openaiService.singleQuery(this.taskName, inputData, {
      systemPrompt: censorshipPrompt()
    });

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: censored
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

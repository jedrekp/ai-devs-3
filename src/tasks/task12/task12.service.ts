import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, parse } from 'path';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { VectorService } from 'src/shared/vector/vector.service';
import { generateUUID } from 'src/utils/id.utils';

@Injectable()
export class Task12Service {
  private readonly taskName = 'wektory';
  private readonly fileKeywordsPromptName = 'KEYWORD_GENERATOR';
  private readonly task12AssetsDirectory = join(__dirname, '..', '..', '..', 'assets', 'task12');
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    private readonly vectorService: VectorService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async prepareData(): Promise<void> {
    await this.vectorService.deleteAllPoints(this.vectorService.weaponReportsCollection);

    const trace = this.langfuseService.createTrace(`${this.taskName}_preparation`);
    const filesKeywordPrompt = await this.langfuseService.getCompiledPrompt(this.fileKeywordsPromptName);

    const reportFileNames = await fs.readdir(this.task12AssetsDirectory);

    const points = await Promise.all(
      reportFileNames.map(async filename => {
        const content = await fs.readFile(join(this.task12AssetsDirectory, filename), 'utf-8');

        const query = `Filename: ${filename} \n\n Content: ${content}`;
        const keywords: string = await this.openaiService.singleQuery(`Keywords: ${filename}`, query, {
          systemPrompt: filesKeywordPrompt,
          trace,
          temperature: 0.5
        });

        const reportDate = parse(filename).name;

        const data = `Report dated: ${reportDate}\n\n${content}\n\nKeywords: ${keywords}`;

        const embedding = await this.openaiService.createEmbedding(`Embedding ${filename}`, data, { trace });

        return { id: generateUUID(), vector: embedding, payload: { filename, reportDate } };
      })
    );

    this.langfuseService.finalizeTrace(trace, { output: points });

    await this.vectorService.addPoints(this.vectorService.weaponReportsCollection, points);
  }
}

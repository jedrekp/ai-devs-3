import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, parse } from 'path';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { VectorService } from 'src/shared/vector/vector.service';
import { generateUUID } from 'src/utils/id.utils';
import { WeaponReportMetadata } from './task12.type';

@Injectable()
export class Task12Service {
  private readonly taskName = 'wektory';
  private readonly fileKeywordsPromptName = 'KEYWORD_GENERATOR';
  private readonly findRelevantReportPromptName = 'MOST_RELEVANT_REPORT_TO_QUERY';
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

  async prepareTask12Data(): Promise<void> {
    await this.vectorService.deleteAllPoints(this.vectorService.weaponReportsCollection);

    const reportFileNames = await fs.readdir(this.task12AssetsDirectory);

    const trace = this.langfuseService.createTrace(`${this.taskName}_preparation`);
    const filesKeywordPrompt = await this.langfuseService.getCompiledPrompt(this.fileKeywordsPromptName);

    const points = await Promise.all(
      reportFileNames.map(async filename => {
        const content = await fs.readFile(join(this.task12AssetsDirectory, filename), 'utf-8');

        const query = `Filename: ${filename} \n\n Content: ${content}`;
        const keywords: string = await this.openaiService.singleQuery(`Keywords: ${filename}`, query, {
          systemPrompt: filesKeywordPrompt,
          trace,
          temperature: 0.5
        });

        const reportDate = parse(filename).name.replaceAll('_', '-');

        const embedding = await this.openaiService.createEmbedding(`Embedding ${filename}`, keywords, { trace });

        return { id: generateUUID(), vector: embedding, payload: { filename, reportDate, keywords } };
      })
    );

    this.langfuseService.finalizeTrace(trace, { output: points });

    await this.vectorService.addPoints(this.vectorService.weaponReportsCollection, points);
  }

  async executeTask12(query: string): Promise<{ code: number; message: string }> {
    const trace = this.langfuseService.createTrace(`${this.taskName}_execution`);
    const embedding = await this.openaiService.createEmbedding(`Embedding query: ${query.substring(0, 20)}...`, query, {
      trace
    });

    const results = (await this.vectorService.search(this.vectorService.weaponReportsCollection, embedding, {
      limit: 3
    })) as unknown as { payload: WeaponReportMetadata }[];

    const reports = await Promise.all(
      results.map(async result => {
        const content = await fs.readFile(join(this.task12AssetsDirectory, result.payload.filename));
        return { reportDate: result.payload.reportDate, content };
      })
    );

    const context = reports.reduce((context, report) => {
      return context + `Date: ${report.reportDate}\n${report.content}\n\n\n`;
    }, '');

    const findRelevantReportPrompt = await this.langfuseService.getCompiledPrompt(this.findRelevantReportPromptName, {
      reports: context
    });

    const reportDate = await this.openaiService.singleQuery(`Find relevant report`, query, {
      systemPrompt: findRelevantReportPrompt,
      trace
    });

    this.langfuseService.finalizeTrace(trace);

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: reportDate
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

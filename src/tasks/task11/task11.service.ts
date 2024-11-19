import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { LangfuseTraceClient } from 'langfuse';
import { join } from 'path';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { Task11ReadFile } from './task11.type';

@Injectable()
export class Task11Service {
  private readonly taskName = 'dokumenty';
  private readonly fileKeywordsPromptName = 'KEYWORD_GENERATOR';
  private readonly fileWithContextKeywordsPromptName = 'KEYWORD_GENERATOR_WITH_CONTEXT';
  private readonly task11AssetsDirectory = join(__dirname, '..', '..', '..', 'assets', 'task11');
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask11(): Promise<{ code: number; message: string }> {
    const [reportFileNames, factsFileNames] = await Promise.all([
      fs.readdir(join(this.task11AssetsDirectory, 'reports')),
      fs.readdir(join(this.task11AssetsDirectory, 'facts'))
    ]);

    const trace = this.langfuseService.createTrace(this.taskName);

    const [reports, facts] = await Promise.all([
      this.processFiles('reports', reportFileNames, trace),
      this.processFiles('facts', factsFileNames, trace)
    ]);

    const completeReports = await this.processReportsWithContext(reports, facts, trace);

    const answer = completeReports.reduce((answer, report) => {
      answer[report.filename] = report.keywords.join(',');
      return answer;
    }, {});

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: answer
    };

    this.langfuseService.finalizeTrace(trace, { output: answer });

    return this.http.post(this.reportUrl, resolvedTask);
  }

  private async processFiles(
    directoryName: string,
    fileNames: string[],
    trace?: LangfuseTraceClient
  ): Promise<Task11ReadFile[]> {
    const fileKeywordsPrompt = await this.langfuseService.getCompiledPrompt(this.fileKeywordsPromptName);

    return Promise.all(
      fileNames.map(async filename => {
        const content = await fs.readFile(join(this.task11AssetsDirectory, directoryName, filename), 'utf-8');

        const query = `Filename: ${filename} \n\n Content: ${content}`;
        const keywords: string = await this.openaiService.singleQuery(`Keywords: ${filename}`, query, {
          systemPrompt: fileKeywordsPrompt,
          trace,
          temperature: 0.5
        });

        return {
          filename,
          content,
          keywords: keywords
            .toLowerCase()
            .split(',')
            .map(keyword => keyword.trim())
            .filter(Boolean)
        };
      })
    );
  }

  private async processReportsWithContext(
    reports: Task11ReadFile[],
    facts: Task11ReadFile[],
    trace?: LangfuseTraceClient
  ): Promise<Task11ReadFile[]> {
    const fileWithContextKeywordsPromt = await this.langfuseService.getPrompt(this.fileWithContextKeywordsPromptName);
    return Promise.all(
      reports.map(async report => {
        const matchingFacts = facts.filter(fact => fact.keywords.some(keyword => report.keywords.includes(keyword)));

        if (!matchingFacts.length) return report;

        const context = matchingFacts.reduce((context, fact) => {
          return context + `${fact.content}\n\n\n`;
        }, '');

        const query = `Filename: ${report.filename} \n\n Content: ${report.content}`;
        const completeKeywords = await this.openaiService.singleQuery(`Complete keywords: ${report.filename}`, query, {
          systemPrompt: fileWithContextKeywordsPromt.compile({ facts: context }),
          trace,
          temperature: 0.5
        });

        const completeKeywordsArray = completeKeywords
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);

        return {
          ...report,
          keywords: [...new Set([...report.keywords, ...completeKeywordsArray])]
        };
      })
    );
  }
}

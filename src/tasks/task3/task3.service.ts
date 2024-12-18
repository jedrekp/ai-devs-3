import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LangfuseTraceClient } from 'langfuse';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import {
  isTestDataExtendedQuestion as isTestDataExtendedItem,
  OpenQuestion,
  TestData,
  TestDataBaseItem,
  TestDataExtendedItem
} from './task3.type';

@Injectable()
export class Task3Service {
  private readonly taskName = 'JSON';
  private readonly answerMultipleQuestionsPromptName = 'ANSWER_MULTIPLE_QUESTIONS';
  private readonly centralaAgentsApiUrl: string;
  private readonly centralaAgentsApiKey: string;
  private readonly inputDataUrl: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    this.centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.inputDataUrl = `${this.centralaAgentsApiUrl}/data/${this.centralaAgentsApiKey}/json.txt`;
    this.reportUrl = `${this.centralaAgentsApiUrl}/report`;
  }

  async executeTask3(): Promise<{ code: number; message: string }> {
    const inputData: { apikey: string; 'test-data': TestData } = await this.http.get(this.inputDataUrl);

    const extendedItems: TestDataExtendedItem[] = inputData['test-data'].filter(item => isTestDataExtendedItem(item));

    const trace = this.langfuseService.createTrace(this.taskName);

    const openQuestions = extendedItems.map(item => item.test);
    const resolvedOpenQuestions = await this.resolveOpenQuestions(openQuestions, trace);

    this.langfuseService.finalizeTrace(trace);

    const processedData = {
      ...inputData,
      apikey: this.centralaAgentsApiKey,
      'test-data': inputData['test-data'].map(item => this.fixTestDataItem(item, resolvedOpenQuestions))
    };

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: processedData
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }

  private fixTestDataItem(item: TestDataBaseItem, resolvedOpenQuestions: OpenQuestion[]) {
    return {
      question: item.question,
      answer: this.resolveMathEquation(item),
      ...(isTestDataExtendedItem(item) && {
        test: {
          q: item.test.q,
          a: resolvedOpenQuestions.find(openQuestion => openQuestion.q === item.test.q)?.a
        }
      })
    };
  }

  private async resolveOpenQuestions(openQuestions: OpenQuestion[], trace?: LangfuseTraceClient) {
    const resolvedOpenQuestions = await this.openaiService.singleQuery(
      'answer multiple questions',
      JSON.stringify(openQuestions),
      {
        systemPrompt: await this.langfuseService.getCompiledPrompt(this.answerMultipleQuestionsPromptName),
        trace
      }
    );
    return JSON.parse(resolvedOpenQuestions) as OpenQuestion[];
  }

  private resolveMathEquation(item: TestDataBaseItem): number {
    const numbersForEquation = item.question.split('+').map(stringNumber => Number(stringNumber.trim()));
    return numbersForEquation.reduce((acc, curr) => acc + curr, 0);
  }
}

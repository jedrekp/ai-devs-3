import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LangfuseTraceClient, TextPromptClient } from 'langfuse';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import * as TurndownService from 'turndown';

@Injectable()
export class Task18Service {
  private readonly taskName = 'softo';
  private readonly softoWebsiteUrl = 'https://softo.ag3nts.org';
  private readonly scrapWebsitePromptName = 'SCRAP_WEBSITE';
  private readonly pageContentCache = new Map<string, string>();
  private readonly centralaAgentsApiKey: string;
  private readonly questionsUrl: string;
  private readonly reportUrl: string;
  private readonly turnDownInstance: TurndownService;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.questionsUrl = `${centralaAgentsApiUrl}/data/${this.centralaAgentsApiKey}/softo.json`;
    this.reportUrl = `${centralaAgentsApiUrl}/report`;

    this.turnDownInstance = new TurndownService();
    this.turnDownInstance.addRule('url', {
      filter: 'a',
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const href = element.getAttribute('href');
        const title = element.getAttribute('title');
        const text = content.trim();

        const completeHref = href.startsWith('https') ? href : `${this.softoWebsiteUrl}${href}`;

        return `[label: ${text} url: ${completeHref}${title ? ' Description: ' + title : ''}]`;
      }
    });
  }

  async executeTask18() {
    const inputData = await this.http.get(this.questionsUrl);

    const scrapWebsitePrompt = await this.langfuseService.getPrompt(this.scrapWebsitePromptName);
    const trace = this.langfuseService.createTrace(this.taskName);

    const questions = Object.entries(inputData).map(([id, value]) => ({ id, value }) as { id: string; value: string });

    const answers: { id: string; answer: string }[] = [];

    for (const question of questions) {
      const answer = await this.scrapWebsiteForAnswer(question, scrapWebsitePrompt, trace);
      answers.push(answer);
    }

    const finalAnswer = answers.reduce((acc, item) => {
      acc[item.id] = item.answer;
      return acc;
    }, {});

    this.langfuseService.finalizeTrace(trace, { output: finalAnswer });

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: finalAnswer
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }

  private async scrapWebsiteForAnswer(
    question: { id: string; value: string },
    prompt: TextPromptClient,
    trace?: LangfuseTraceClient
  ) {
    let url = this.softoWebsiteUrl;
    const visitedPagesCount = 0;

    console.info('Scrapping website for answer to question: ', question.id, question.value);

    while (visitedPagesCount < 10) {
      console.info('Checking page: ', url);
      const content = await this.getPageContent(url);
      const agentResponse = await this.openaiService.singleQuery(
        `Question: ${question.id}, Url: ${url}`,
        question.value,
        {
          systemPrompt: prompt.compile({ content }),
          jsonMode: true,
          trace
        }
      );
      const parsedResponse = JSON.parse(agentResponse);
      if (parsedResponse.answer) {
        console.info('Answer found in page: ', url);
        return { id: question.id, answer: parsedResponse.answer };
      }
      url = parsedResponse.url;
    }
    throw new Error(`Unable to find answer to question: ${question.id}`);
  }

  private async getPageContent(url: string) {
    const cachedPageContent = this.pageContentCache.get(url);
    if (cachedPageContent) return cachedPageContent;

    const html = await this.http.get(url);
    const markdown = this.turnDownInstance.turndown(html);
    this.pageContentCache.set(url, markdown);
    return markdown;
  }
}

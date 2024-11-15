import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task1Service {
  private readonly taskName = 'LOGINPAGE';
  private readonly answerHtmlQuestionPromptName = 'ANSWER_QUESTION_IN_HTML';
  private readonly loginPageUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    this.loginPageUrl = configService.get<string>('AGENTS_API_URL');
    this.username = configService.get<string>('AGENTS_API_USERNAME');
    this.password = configService.get<string>('AGENTS_API_PASSWORD');
  }

  async executeTask1(): Promise<string> {
    const loginPageHtml: string = await this.http.get(this.loginPageUrl);

    const loginData = {
      username: this.username,
      password: this.password,
      answer: await this.openaiService.singleQuery(this.taskName, loginPageHtml, {
        systemPrompt: await this.langfuseService.getCompiledPrompt(this.answerHtmlQuestionPromptName)
      })
    };

    return this.http.submitFormData(this.loginPageUrl, loginData);
  }
}

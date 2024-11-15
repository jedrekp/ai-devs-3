import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { Task2CommunicationFormat } from './task2.type';

@Injectable()
export class Task2Service {
  private readonly taskName = 'AUTH';
  private readonly answerQuestionsWithFalseContextPromptName = 'ANSWER_QUESTIONS_WITH_FALSE_CONTEXT';
  private readonly verificationPageUrl: string;
  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    this.verificationPageUrl = `${configService.get<string>('AGENTS_API_URL')}/verify`;
  }

  async executeTask2(): Promise<Task2CommunicationFormat> {
    const initCommunicationRequest: Task2CommunicationFormat = {
      text: 'READY',
      msgID: '0'
    };
    const initCommunicationResponse: Task2CommunicationFormat = await this.http.post(
      this.verificationPageUrl,
      initCommunicationRequest
    );

    const verificationRequest: Task2CommunicationFormat = {
      text: await this.openaiService.singleQuery(this.taskName, initCommunicationResponse.text, {
        systemPrompt: await this.langfuseService.getCompiledPrompt(this.answerQuestionsWithFalseContextPromptName)
      }),
      msgID: String(initCommunicationResponse.msgID)
    };

    return this.http.post(this.verificationPageUrl, verificationRequest);
  }
}

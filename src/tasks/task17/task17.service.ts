import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task17Service {
  private readonly inputData = [
    { id: '01', value: '12,100,3,39' },
    { id: '02', value: '-41,75,67,-25' },
    { id: '03', value: '78,38,65,2' },
    { id: '04', value: '5,64,67,30' },
    { id: '05', value: '33,-21,16,-72' },
    { id: '06', value: '99,17,69,61' },
    { id: '07', value: '17,-42,-65,-43' },
    { id: '08', value: '57,-83,-54,-43' },
    { id: '09', value: '67,-55,-6,-32' },
    { id: '10', value: '-20,-23,-2,44' }
  ];

  private readonly taskName = 'research';
  private readonly validateSequencePromptName = 'VALIDATE_SEQUENCE';
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;
  private readonly sequenceValidatorModel: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.sequenceValidatorModel = configService.get<string>('FINE_TUNED_MODEL_SEQUENCE_VALIDATOR');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask17() {
    const validateSequencePrompt = await this.langfuseService.getCompiledPrompt(this.validateSequencePromptName);
    const trace = this.langfuseService.createTrace(this.taskName);

    const correctSequences = (
      await Promise.all(
        this.inputData.map(async sequence => {
          const isCorrect =
            (await this.openaiService.singleQuery(`Sequence: ${sequence.id}`, sequence.value, {
              systemPrompt: validateSequencePrompt,
              fineTunedModel: this.sequenceValidatorModel,
              trace
            })) === 'correct';
          return isCorrect ? sequence.id : null;
        })
      )
    ).filter(Boolean);

    this.langfuseService.finalizeTrace(trace, { output: correctSequences });

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: correctSequences
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

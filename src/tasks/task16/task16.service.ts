import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LangfuseTraceClient } from 'langfuse';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task16Service {
  private readonly taskName = 'photos';
  private readonly pickToolPromptName = 'PICK_TOOL';
  private readonly fileNames = ['IMG_559.PNG', 'IMG_1410.PNG', 'IMG_1443.PNG', 'IMG_1444.PNG'];
  private readonly createDescriptionPromptName = 'CREATE_PERSON_DESCRIPTION';
  private readonly extractFilenamePrompt = 'EXTRACT_FILENAME';
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;
  private readonly downloadPhotoUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
    this.downloadPhotoUrl = `${centralaAgentsApiUrl}/dane/barbara`;
  }

  async executeTask16() {
    const pickToolPrompt = await this.langfuseService.getCompiledPrompt(this.pickToolPromptName);
    const createDescriptionPrompt = await this.langfuseService.getCompiledPrompt(this.createDescriptionPromptName);
    const extractFilenamePrompt = await this.langfuseService.getCompiledPrompt(this.extractFilenamePrompt);

    const trace = this.langfuseService.createTrace(this.taskName);

    for (const filename of this.fileNames) {
      console.info('Attempting description generation:', filename);

      const result = await this.processImage(
        filename,
        {
          pickTool: pickToolPrompt,
          createDescription: createDescriptionPrompt,
          extractFilename: extractFilenamePrompt
        },
        trace
      );

      if (result === 'INVALID_IMAGE') {
        console.info('Description impossible', filename);
        continue;
      }

      this.langfuseService.finalizeTrace(trace, { output: { originalFilename: filename, description: result } });
      console.info('Submiting descritpion', filename);

      const resolvedTask = {
        task: this.taskName,
        apikey: this.centralaAgentsApiKey,
        answer: result
      };
      return await this.http.post(this.reportUrl, resolvedTask);
    }
  }

  private async processImage(
    filename: string,
    prompts: {
      pickTool: string;
      extractFilename: string;
      createDescription: string;
    },
    trace?: LangfuseTraceClient
  ) {
    let currentFileName = filename;

    while (currentFileName !== 'NO_FILE') {
      console.info('Processing image, current filename:', currentFileName);

      const image = await this.http.get(
        `${this.downloadPhotoUrl}/${currentFileName.replace('.PNG', '-small.PNG')}`,
        'arraybuffer'
      );
      const base64EncodedImage: string = Buffer.from(image).toString('base64');

      const selectedTool: string = await this.openaiService.singleImageQuery(
        `Pick tool: ${currentFileName}`,
        base64EncodedImage,
        'png',
        { systemPrompt: prompts.pickTool, trace }
      );

      console.info(`${currentFileName}, tool selected:`, selectedTool);

      if (selectedTool === 'OK')
        return this.createDescription(currentFileName, base64EncodedImage, prompts.createDescription, trace);

      currentFileName = await this.transformPhoto(currentFileName, selectedTool, prompts.extractFilename, trace);
    }

    return 'INVALID_IMAGE';
  }

  private async transformPhoto(
    filename: string,
    tool: string,
    extractFilenamePrompt: string,
    trace?: LangfuseTraceClient
  ): Promise<string> {
    const response = await this.http.post(this.reportUrl, {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: `${tool} ${filename}`
    });
    const message = response.message;

    return this.openaiService.singleQuery(`Extract filename: ${message.slice(0, 15)}`, message, {
      systemPrompt: extractFilenamePrompt,
      trace
    });
  }

  private async createDescription(
    filename: string,
    base64EncodedImage: string,
    createDescriptionPrompt: string,
    trace?: LangfuseTraceClient
  ): Promise<string> {
    return this.openaiService.singleImageQuery(`Create description: ${filename}`, base64EncodedImage, 'png', {
      systemPrompt: createDescriptionPrompt,
      trace
    });
  }
}

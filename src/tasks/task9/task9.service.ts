import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { LangfuseTraceClient } from 'langfuse';
import { join } from 'path';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import { Task9ReadFile } from './task9.type';

@Injectable()
export class Task9Service {
  private readonly taskName = 'kategorie';
  private readonly textExtractionFromImagePromptName = 'TEXT_EXTRACTION_FROM_IMAGE';
  private readonly categoryAssignmentPromptName = 'CATEGORY_ASSIGNMENT';
  private readonly task9AssetsDirectory = join(__dirname, '..', '..', '..', 'assets', 'task9');
  private readonly centralaAgentsApiKey: string;
  private readonly reportUrl: string;

  private readonly transcribedMp3Cache: Map<string, string>;
  private readonly readImageCache: Map<string, string>;
  private readonly readTextCache: Map<string, string>;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
    this.transcribedMp3Cache = new Map<string, string>();
    this.readImageCache = new Map<string, string>();
    this.readTextCache = new Map<string, string>();
  }

  async executeTask9() {
    const [txtFileNames, mp3FileNames, pngFileNames] = await Promise.all([
      fs.readdir(join(this.task9AssetsDirectory, 'txt')),
      fs.readdir(join(this.task9AssetsDirectory, 'mp3')),
      fs.readdir(join(this.task9AssetsDirectory, 'png'))
    ]);

    const [textExtractionFromImageSystemPrompt, categoryAssignmentSystemPrompt] = await Promise.all([
      this.langfuseService.getCompiledPrompt(this.textExtractionFromImagePromptName),
      this.langfuseService.getCompiledPrompt(this.categoryAssignmentPromptName)
    ]);

    const trace = this.langfuseService.createTrace(this.taskName);

    const [readTxtFiles, transcribedMp3Files, readImageFiles] = await Promise.all([
      this.processTxtFiles(txtFileNames),
      this.processMp3Files(mp3FileNames, trace),
      this.processImageFiles(pngFileNames, textExtractionFromImageSystemPrompt, trace)
    ]);

    const allReadFiles: Task9ReadFile[] = [...readTxtFiles, ...transcribedMp3Files, ...readImageFiles];

    const categorizedFiles = await Promise.all(
      allReadFiles.map(async file => {
        return {
          filename: file.filename,
          category: await this.openaiService.singleQuery('Assign category', file.content, {
            systemPrompt: categoryAssignmentSystemPrompt,
            trace
          })
        };
      })
    );

    this.langfuseService.finalizeTrace(trace);

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: {
        people: categorizedFiles
          .filter(file => file.category === 'people')
          .map(file => file.filename)
          .sort((a, b) => a.localeCompare(b)),
        hardware: categorizedFiles
          .filter(file => file.category === 'hardware')
          .map(file => file.filename)
          .sort((a, b) => a.localeCompare(b))
      }
    };

    console.info('resolvedTask', resolvedTask);

    return this.http.post(this.reportUrl, resolvedTask);
  }

  private async processTxtFiles(txtFileNames: string[]): Promise<Task9ReadFile[]> {
    return Promise.all(
      txtFileNames.map(async filename => {
        const content = this.readTextCache.get(filename);
        if (content) {
          return { filename, content };
        }
        const text = await fs.readFile(join(this.task9AssetsDirectory, 'txt', filename), 'utf-8');
        this.readTextCache.set(filename, text);
        return { filename, content: text };
      })
    );
  }

  private async processMp3Files(mp3FileNames: string[], trace?: LangfuseTraceClient): Promise<Task9ReadFile[]> {
    return Promise.all(
      mp3FileNames.map(async filename => {
        const content = this.transcribedMp3Cache.get(filename);
        if (content) {
          return { filename, content };
        }
        const fileBuffer = await fs.readFile(join(this.task9AssetsDirectory, 'mp3', filename));
        const transcription = await this.openaiService.transcribe(`Transcription: ${filename}`, fileBuffer, 'mp3', {
          description: filename,
          trace
        });
        this.transcribedMp3Cache.set(filename, transcription);
        return { filename, content: transcription };
      })
    );
  }

  private async processImageFiles(
    pngFileNames: string[],
    systemPrompt: string,
    trace?: LangfuseTraceClient
  ): Promise<Task9ReadFile[]> {
    return Promise.all(
      pngFileNames.map(async filename => {
        const content = this.readImageCache.get(filename);
        if (content) {
          return { filename, content };
        }
        const image = await fs.readFile(join(this.task9AssetsDirectory, 'png', filename));
        const readImage = await this.openaiService.singleImageQuery(
          `Image description: ${filename}`,
          image.toString('base64'),
          'png',
          {
            systemPrompt,
            trace
          }
        );
        this.readImageCache.set(filename, readImage);
        return { filename, content: readImage };
      })
    );
  }
}

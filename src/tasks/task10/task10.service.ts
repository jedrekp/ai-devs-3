import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LangfuseTraceClient } from 'langfuse';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';
import * as TurndownService from 'turndown';

@Injectable()
export class Task10Service {
  private readonly taskName = 'arxiv';
  private readonly describeImagePromptName = 'DESCRIBE_IMAGE_WITH_CAPTION';
  private readonly answerQustionsAboutArticlePromptName = 'ANSWER_ARTICLE_RELATED_QUESTIONS';
  private readonly centralaAgentsApiUrl: string;
  private readonly centralaAgentsApiKey: string;
  private readonly articleUrl: string;
  private readonly questionsUrl: string;
  private readonly reportUrl: string;

  private readonly transcribedMp3Cache: Map<string, string>;
  private readonly readImageCache: Map<string, string>;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    this.centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.articleUrl = `${this.centralaAgentsApiUrl}/dane/arxiv-draft.html`;
    this.questionsUrl = `${this.centralaAgentsApiUrl}/data/${this.centralaAgentsApiKey}/arxiv.txt`;
    this.reportUrl = `${this.centralaAgentsApiUrl}/report`;
    this.transcribedMp3Cache = new Map<string, string>();
    this.readImageCache = new Map<string, string>();
  }

  async executeTask10(): Promise<{ code: number; message: string }> {
    const articleHtml = await this.http.get(this.articleUrl);
    const { images, mp3s, markdown } = this.convertToMarkDown(articleHtml);

    const trace = this.langfuseService.createTrace(this.taskName);

    const imagesWithDesc = await this.generateImagesDescriptions(images, trace);
    const transcribedMp3Files = await this.transcribeMp3Files(mp3s, trace);
    const updatedMarkdown = await this.replaceUrlsWithDesc(markdown, [...imagesWithDesc, ...transcribedMp3Files]);

    const questions = await this.http.get(this.questionsUrl);

    const answers = await this.openaiService.singleQuery('Answer article related questions', questions, {
      systemPrompt: await this.langfuseService.getCompiledPrompt(this.answerQustionsAboutArticlePromptName, {
        article: updatedMarkdown
      }),
      trace,
      jsonMode: true
    });

    this.langfuseService.finalizeTrace(trace, { output: { article: updatedMarkdown, questions, answers } });

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: JSON.parse(answers)
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }

  private convertToMarkDown(html: string) {
    const images: { url: string; caption: string }[] = [];
    const mp3s: { url: string }[] = [];
    const turndownService = new TurndownService();

    turndownService.addRule('figure', {
      filter: 'figure',
      replacement: (content, node) => {
        const imageTag = node.querySelector('img');
        const imageUrl = imageTag.getAttribute('src');
        const completeImageUrl = `${this.centralaAgentsApiUrl}/dane/${imageUrl}`;
        const caption = node.querySelector('figcaption').textContent.trim();
        images.push({ url: completeImageUrl, caption });
        return `[IMAGE]${completeImageUrl}[/IMAGE]\n${caption}`;
      }
    });

    turndownService.addRule('audio', {
      filter: 'audio',
      replacement: (content, node) => {
        const sourceNode = node.querySelector('source');
        const mp3Url = sourceNode.getAttribute('src');
        const completeMp3Url = `${this.centralaAgentsApiUrl}/dane/${mp3Url}`;
        mp3s.push({ url: completeMp3Url });
        return `[MP3]${completeMp3Url}[/MP3]`;
      }
    });

    return {
      images: images,
      mp3s: mp3s,
      markdown: turndownService.turndown(html)
    };
  }

  private async generateImagesDescriptions(images: { url: string; caption: string }[], trace?: LangfuseTraceClient) {
    const systemPrompt = await this.langfuseService.getCompiledPrompt(this.describeImagePromptName);
    return Promise.all(
      images.map(async image => {
        const cachedDesc = this.readImageCache.get(image.url);
        if (cachedDesc) return { url: image.url, desc: cachedDesc };

        const img = await this.http.get(image.url, 'arraybuffer');
        const base64EncodedImage: string = Buffer.from(img).toString('base64');

        const description = await this.openaiService.singleImageQuery(
          `Image desc: ${image.caption}`,
          base64EncodedImage,
          'png',
          { systemPrompt, textContent: image.caption, trace }
        );

        this.readImageCache.set(image.url, description);

        return { url: image.url, desc: description };
      })
    );
  }

  private async transcribeMp3Files(mp3s: { url: string }[], trace?: LangfuseTraceClient) {
    return Promise.all(
      mp3s.map(async mp3 => {
        const cachedTranscription = this.transcribedMp3Cache.get(mp3.url);
        if (cachedTranscription) return { url: mp3.url, desc: cachedTranscription };

        const audio = await this.http.get(mp3.url, 'arraybuffer');

        const transcription = await this.openaiService.transcribe(
          `Transcription: ${mp3.url}`,
          Buffer.from(audio),
          'mp3',
          {
            language: 'pl',
            trace
          }
        );

        this.transcribedMp3Cache.set(mp3.url, transcription);

        return { url: mp3.url, desc: transcription };
      })
    );
  }

  private replaceUrlsWithDesc(markdown: string, enrichedImages: { url: string; desc: string }[]): string {
    return enrichedImages.reduce((updatedMarkdown, image) => {
      return updatedMarkdown.replace(image.url, image.desc);
    }, markdown);
  }
}

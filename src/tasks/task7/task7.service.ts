import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task7Service {
  private readonly taskName = 'MAP';
  private readonly inputFileExtension = 'JPG';
  private task7AssetsDirectory = join(__dirname, '..', '..', '..', 'assets', 'task7');
  private readonly maps = ['MAP1', 'MAP2', 'MAP3', 'MAP4'];
  private readonly mapDescriptionPromptName = 'MAP_IMAGE_DESCRIPTION';
  private readonly findCityPromptName = 'FIND_CITY_BASED_ON_MAP_DESCRIPTION';

  private readonly mapsDescriptionCache: Map<string, string>;

  constructor(
    private readonly openaiService: OpenaiService,
    private langfuseService: LangfuseService
  ) {
    this.mapsDescriptionCache = new Map<string, string>();
  }

  async executeTask7() {
    const mapDescriptionSystemPrompt = await this.langfuseService.getCompiledPrompt(this.mapDescriptionPromptName);

    const trace = this.langfuseService.createTrace(this.taskName);

    const mapDescritpions: { name: string; description: string }[] = await Promise.all(
      this.maps.map(async name => {
        const cachedDescription: string = this.mapsDescriptionCache.get(name);
        if (cachedDescription) return { name, description: cachedDescription };

        const filePath = join(this.task7AssetsDirectory, `${name}.${this.inputFileExtension}`);
        const image = await fs.readFile(filePath);
        const description = await this.openaiService.singleImageQuery(
          `Description: ${name}`,
          image.toString('base64'),
          this.inputFileExtension,
          {
            systemPrompt: mapDescriptionSystemPrompt,
            temperature: 0.8,
            trace
          }
        );

        this.mapsDescriptionCache.set(name, description);

        return { name, description };
      })
    );

    const userQuery = mapDescritpions.map(map => `<${map.name}>${map.description}</${map.name}>`).join('\n\n');

    const city = await this.openaiService.singleQuery('Find matching city.', userQuery, {
      systemPrompt: await this.langfuseService.getCompiledPrompt(this.findCityPromptName),
      trace
    });

    this.langfuseService.finalizeTrace(trace);

    return { city };
  }
}

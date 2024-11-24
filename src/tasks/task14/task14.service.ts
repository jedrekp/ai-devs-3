import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task14Service {
  private readonly taskName = 'loop';
  private readonly listPeopleAndPlacesPromptName = 'LIST_PEOPLE_AND_PLACES';
  private readonly RESTRICTED_DATA_RESPONSE = '[**RESTRICTED DATA**]';
  private readonly centralaAgentsApiKey: string;
  private readonly noteUrl: string;
  private readonly peopleUrl: string;
  private readonly placesUrl: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.noteUrl = `${centralaAgentsApiUrl}/dane/barbara.txt`;
    this.peopleUrl = `${centralaAgentsApiUrl}/people`;
    this.placesUrl = `${centralaAgentsApiUrl}/places`;
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask14(): Promise<{ code: number; message: string }> {
    const note = await this.http.get(this.noteUrl);

    const trace = this.langfuseService.createTrace(this.taskName);
    const listPeopleAndPlacesPrompt = await this.langfuseService.getCompiledPrompt(this.listPeopleAndPlacesPromptName);
    const agentResponse = await this.openaiService.singleQuery('least ppl and places from note', note, {
      systemPrompt: listPeopleAndPlacesPrompt,
      trace,
      jsonMode: true
    });
    this.langfuseService.finalizeTrace(trace);

    const { people: unverifiedPeople, places: unverifiedPlaces } = JSON.parse(agentResponse) as {
      people: string[];
      places: string[];
    };
    const verifiedPeople: string[] = [];
    const verifiedPlaces: string[] = [];

    while (unverifiedPlaces.length > 0 || unverifiedPeople.length > 0) {
      while (unverifiedPlaces.length) {
        const currentPlace = unverifiedPlaces[0];
        const foundPeople: string[] = await this.queryPlace(currentPlace);
        unverifiedPlaces.shift();
        verifiedPlaces.push(currentPlace);
        if (foundPeople.includes('barbara')) {
          const answer = await this.http
            .post(this.reportUrl, {
              task: this.taskName,
              apikey: this.centralaAgentsApiKey,
              answer: currentPlace
            })
            .then(response => (response.code === 0 ? response : null))
            .catch(err => null);
          if (answer) return answer;
        }
        const newUnverifiedPeople = foundPeople.filter(
          person => !verifiedPeople.includes(person) && !unverifiedPeople.includes(person)
        );
        unverifiedPeople.push(...newUnverifiedPeople);
      }
      while (unverifiedPeople.length) {
        const currentPerson = unverifiedPeople[0];
        const foundPlaces: string[] = await this.queryPerson(currentPerson);
        unverifiedPeople.shift();
        verifiedPeople.push(currentPerson);
        const newUnverifiedPlaces = foundPlaces.filter(place => !verifiedPlaces.includes(place));
        unverifiedPlaces.push(...newUnverifiedPlaces);
        if (unverifiedPlaces.length) break;
      }
    }

    return { code: -1, message: 'unable to find barbara location' };
  }

  private async queryPerson(name: string): Promise<string[]> {
    const response = await this.http.post(this.peopleUrl, {
      apikey: this.centralaAgentsApiKey,
      query: name
    });

    if (response.message === this.RESTRICTED_DATA_RESPONSE) return [];
    return response.message
      .split(' ')
      .map((place: string) => place.toLowerCase().trim())
      .map((place: string) => this.replacePolishChars(place));
  }

  private async queryPlace(name: string): Promise<string[]> {
    const response = await this.http.post(this.placesUrl, {
      apikey: this.centralaAgentsApiKey,
      query: name
    });

    if (response.message === this.RESTRICTED_DATA_RESPONSE) return [];
    return response.message
      .split(' ')
      .map((person: string) => person.toLowerCase().trim())
      .map((person: string) => this.replacePolishChars(person));
  }

  private replacePolishChars(input: string): string {
    return input.replace(/[ąćęłńóśźż]/g, char => {
      const replacements: Record<string, string> = {
        ą: 'a',
        ć: 'c',
        ę: 'e',
        ł: 'l',
        ń: 'n',
        ó: 'o',
        ś: 's',
        ź: 'z',
        ż: 'z'
      };
      return replacements[char];
    });
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/shared/http-client/http-client.service';
import { LangfuseService } from 'src/shared/langfuse/langfuse.service';
import { OpenaiService } from 'src/shared/openai/openai.service';

@Injectable()
export class Task13Service {
  private readonly taskName = 'database';
  private readonly buildSqlQueryPromptName = 'BUILD_SQL_QUERY';
  private readonly centralaAgentsApiKey: string;
  private readonly dbEndpointUrl: string;
  private readonly reportUrl: string;

  constructor(
    private readonly http: HttpClientService,
    private readonly openaiService: OpenaiService,
    private readonly langfuseService: LangfuseService,
    configService: ConfigService
  ) {
    const centralaAgentsApiUrl = configService.get<string>('CENTRALA_AGENTS_API_URL');
    this.centralaAgentsApiKey = configService.get<string>('CENTRALA_AGENTS_API_KEY');
    this.dbEndpointUrl = `${centralaAgentsApiUrl}/apidb`;
    this.reportUrl = `${centralaAgentsApiUrl}/report`;
  }

  async executeTask13(userQuery: string) {
    const tableNamesQueryResponse = await this.http.post(this.dbEndpointUrl, {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      query: 'show tables'
    });
    const tableNames: string[] = tableNamesQueryResponse.reply.map(
      (item: { Tables_in_banan: string }) => item.Tables_in_banan
    );

    const dbSchemas = await Promise.all(
      tableNames.map(async name => {
        const schemaQueryResponse = await this.http.post(this.dbEndpointUrl, {
          task: this.taskName,
          apikey: this.centralaAgentsApiKey,
          query: `show create table ${name}`
        });

        return schemaQueryResponse.reply.map(item => ({ table: item.Table, schema: item['Create Table'] }))[0];
      })
    );

    const context = dbSchemas.reduce((context, dbSchema) => {
      return context + `table : ${dbSchema.table}\n${dbSchema.schema}\n\n\n`;
    }, '');

    const buildSqlQuerySystemPrompt = await this.langfuseService.getCompiledPrompt(this.buildSqlQueryPromptName, {
      schemas: context
    });

    const trace = this.langfuseService.createTrace(this.taskName);
    const sqlQuery = await this.openaiService.singleQuery(`SQL query: ${userQuery.slice(0, 20)}...`, userQuery, {
      systemPrompt: buildSqlQuerySystemPrompt,
      trace,
      temperature: 0,
      model: 'gpt-4o-mini'
    });

    const sqlQueryResponse = await this.http.post(this.dbEndpointUrl, {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      query: sqlQuery
    });

    const resolvedTask = {
      task: this.taskName,
      apikey: this.centralaAgentsApiKey,
      answer: sqlQueryResponse.reply.map(item => item.dc_id)
    };

    return this.http.post(this.reportUrl, resolvedTask);
  }
}

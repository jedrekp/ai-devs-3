import { Module } from '@nestjs/common';
import { Task2Controller } from './task2.controller';
import { Task2Service } from './task2.service';
import { HttpClientModule } from 'src/shared/http-client/http-client.module';
import { OpenaiModule } from 'src/shared/openai/openai.module';

@Module({
  imports: [HttpClientModule, OpenaiModule],
  controllers: [Task2Controller],
  providers: [Task2Service],
})
export class Task2Module {}

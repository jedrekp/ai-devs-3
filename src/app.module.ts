import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpClientModule } from './shared/http-client/http-client.module';
import { LangfuseModule } from './shared/langfuse/langfuse.module';
import { OpenaiModule } from './shared/openai/openai.module';
import { Task1Module } from './tasks/task1/task1.module';
import { Task2Module } from './tasks/task2/task2.module';
import { Task3Module } from './tasks/task3/task3.module';
import { Task5Module } from './tasks/task5/task5.module';
import { Task6Module } from './tasks/task6/task6.module';
import { Task7Module } from './tasks/task7/task7.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    OpenaiModule,
    LangfuseModule,
    HttpClientModule,
    Task1Module,
    Task2Module,
    Task3Module,
    Task5Module,
    Task6Module,
    Task7Module
  ]
})
export class AppModule {}

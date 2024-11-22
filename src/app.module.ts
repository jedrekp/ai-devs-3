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
import { Task8Module } from './tasks/task8/task8.module';
import { Task9Module } from './tasks/task9/task9.module';
import { Task10Module } from './tasks/task10/task10.module';
import { Task11Module } from './tasks/task11/task11.module';
import { VectorModule } from './shared/vector/vector.module';
import { Task12Module } from './tasks/task12/task12.module';
import { Task13Module } from './tasks/task13/task13.module';

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
    Task7Module,
    Task8Module,
    Task9Module,
    Task10Module,
    Task11Module,
    VectorModule,
    Task12Module,
    Task13Module
  ]
})
export class AppModule {}

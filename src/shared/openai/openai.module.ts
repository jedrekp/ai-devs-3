import { Global, Module } from '@nestjs/common';
import { LangfuseModule } from '../langfuse/langfuse.module';
import { OpenaiService } from './openai.service';

@Global()
@Module({
  imports: [LangfuseModule],
  providers: [OpenaiService],
  exports: [OpenaiService]
})
export class OpenaiModule {}

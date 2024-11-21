import { Global, Module, OnModuleInit } from '@nestjs/common';
import { VectorService } from './vector.service';

@Global()
@Module({
  providers: [VectorService],
  exports: [VectorService]
})
export class VectorModule implements OnModuleInit {
  constructor(private vectorService: VectorService) {}

  async onModuleInit() {
    await this.vectorService.initializeCollections();
  }
}

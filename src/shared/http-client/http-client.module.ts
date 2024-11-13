import { Global, Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}

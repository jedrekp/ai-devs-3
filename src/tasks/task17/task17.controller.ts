import { Controller, Get } from '@nestjs/common';
import { Task17Service } from './task17.service';

@Controller('task17')
export class Task17Controller {
  constructor(private task17Service: Task17Service) {}

  @Get('execution')
  executeTask17(): Promise<{ code: number; message: string }> {
    return this.task17Service.executeTask17();
  }
}

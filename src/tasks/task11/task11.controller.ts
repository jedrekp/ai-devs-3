import { Controller, Get } from '@nestjs/common';
import { Task11Service } from './task11.service';

@Controller('task11')
export class Task11Controller {
  constructor(private task11Service: Task11Service) {}

  @Get('execution')
  executeTask11(): Promise<{ code: number; message: string }> {
    return this.task11Service.executeTask11();
  }
}

import { Controller, Get } from '@nestjs/common';
import { Task14Service } from './task14.service';

@Controller('task14')
export class Task14Controller {
  constructor(private task14Service: Task14Service) {}

  @Get('execution')
  executeTask14(): Promise<{ code: number; message: string }> {
    return this.task14Service.executeTask14();
  }
}

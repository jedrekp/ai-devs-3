import { Controller, Get } from '@nestjs/common';
import { Task3Service } from './task3.service';

@Controller('task3')
export class Task3Controller {
  constructor(private task3Service: Task3Service) {}

  @Get('execution')
  executeTask3(): Promise<{ code: number; message: string }> {
    return this.task3Service.executeTask3();
  }
}

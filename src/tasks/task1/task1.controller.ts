import { Controller, Get } from '@nestjs/common';
import { Task1Service } from './task1.service';

@Controller('task1')
export class Task1Controller {
  constructor(private task1Service: Task1Service) {}

  @Get()
  executeTask1(): Promise<string> {
    return this.task1Service.executeTask1();
  }
}

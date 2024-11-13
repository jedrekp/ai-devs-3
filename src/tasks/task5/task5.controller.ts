import { Controller, Get } from '@nestjs/common';
import { Task5Service } from './task5.service';

@Controller('task5')
export class Task5Controller {
  constructor(private task5Service: Task5Service) {}

  @Get()
  executeTask5(): Promise<{ code: number; message: string }> {
    return this.task5Service.executeTask5();
  }
}

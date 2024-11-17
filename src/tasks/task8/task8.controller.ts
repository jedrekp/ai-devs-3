import { Controller, Get } from '@nestjs/common';
import { Task8Service } from './task8.service';

@Controller('task8')
export class Task8Controller {
  constructor(private task8Service: Task8Service) {}

  @Get()
  executeTask8(): Promise<any> {
    return this.task8Service.executeTask8();
  }
}

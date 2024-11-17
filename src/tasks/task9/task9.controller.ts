import { Controller, Get } from '@nestjs/common';
import { Task9Service } from './task9.service';

@Controller('task9')
export class Task9Controller {
  constructor(private task9Service: Task9Service) {}

  @Get()
  executeTask9(): Promise<{ code: number; message: string }> {
    return this.task9Service.executeTask9();
  }
}

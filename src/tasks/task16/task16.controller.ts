import { Controller, Get } from '@nestjs/common';
import { Task16Service } from './task16.service';

@Controller('task16')
export class Task16Controller {
  constructor(private task16Service: Task16Service) {}

  @Get('execution')
  executeTask16(): Promise<{ code: number; message: string }> {
    return this.task16Service.executeTask16();
  }
}

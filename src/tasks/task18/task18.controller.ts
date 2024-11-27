import { Controller, Get } from '@nestjs/common';
import { Task18Service } from './task18.service';

@Controller('task18')
export class Task18Controller {
  constructor(private task18Service: Task18Service) {}

  @Get('execution')
  executeTask18(): Promise<{ code: number; message: string }> {
    return this.task18Service.executeTask18();
  }
}

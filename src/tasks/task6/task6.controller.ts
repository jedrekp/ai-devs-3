import { Controller, Get } from '@nestjs/common';
import { Task6Service } from './task6.service';

@Controller('task6')
export class Task6Controller {
  constructor(private task6Service: Task6Service) {}

  @Get('execution')
  async executeTask6(): Promise<{ code: number; message: string }> {
    return this.task6Service.executeTask6('Na jakiej ulicy znajduje się uczelnia, na której wykłada Andrzej Maj?');
  }
}

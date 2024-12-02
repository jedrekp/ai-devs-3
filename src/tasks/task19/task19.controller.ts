import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Task19Service } from './task19.service';

@Controller('task19')
export class Task19Controller {
  constructor(private task19Service: Task19Service) {}

  @Get('execution')
  executeTask19(): Promise<{ code: number; message: string }> {
    return this.task19Service.executeTask19();
  }

  @Post('webhook')
  @HttpCode(200)
  executeTask19Webhook(@Body() reqBody: { instruction: string }): Promise<{ description: string }> {
    const { instruction } = reqBody;
    return this.task19Service.executeTask19Webhook(instruction);
  }
}

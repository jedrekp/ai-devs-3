import { Controller, Get } from '@nestjs/common';
import { Task10Service } from './task10.service';

@Controller('task10')
export class Task10Controller {
  constructor(private task10Service: Task10Service) {}

  @Get()
  //executeTask10(): Promise<{ code: number; message: string }> {
  executeTask10(): Promise<any> {
    return this.task10Service.executeTask10();
  }
}

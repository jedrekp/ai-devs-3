import { Controller, Get } from '@nestjs/common';
import { Task2Service } from './task2.service';
import { Task2CommunicationFormat } from './task2.type';

@Controller('task2')
export class Task2Controller {
  constructor(private task2Service: Task2Service) {}

  @Get('execution')
  executeTask2(): Promise<Task2CommunicationFormat> {
    return this.task2Service.executeTask2();
  }
}

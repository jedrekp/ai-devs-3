import { Controller, Get } from '@nestjs/common';
import { Task12Service } from './task12.service';

@Controller('task12')
export class Task12Controller {
  constructor(private task12Service: Task12Service) {}

  @Get('preparation')
  prepareData(): Promise<void> {
    return this.task12Service.prepareData();
  }
}

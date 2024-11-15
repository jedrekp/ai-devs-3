import { Controller, Get } from '@nestjs/common';
import { Task7Service } from './task7.service';

@Controller('task7')
export class Task7Controller {
  constructor(private task7Service: Task7Service) {}

  @Get()
  executeTask7(): Promise<{ city: string }> {
    return this.task7Service.executeTask7();
  }
}

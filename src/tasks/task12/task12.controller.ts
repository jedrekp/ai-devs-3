import { Controller, Get } from '@nestjs/common';
import { Task12Service } from './task12.service';

@Controller('task12')
export class Task12Controller {
  constructor(private task12Service: Task12Service) {}

  @Get('preparation')
  prepareData(): Promise<void> {
    return this.task12Service.prepareTask12Data();
  }

  @Get('execution')
  executeTask12(): Promise<{ code: number; message: string }> {
    return this.task12Service.executeTask12(
      'W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?'
    );
  }
}

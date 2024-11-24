import { Controller, Get } from '@nestjs/common';
import { Task13Service } from './task13.service';

@Controller('task13')
export class Task13Controller {
  constructor(private task13Service: Task13Service) {}

  @Get('execution')
  executeTask13(): Promise<{ code: number; message: string }> {
    const userQuery = 'Podaj id aktywnych datacenter zarządzanych przez pracowników, którzy są nieaktywni.';
    return this.task13Service.executeTask13(userQuery);
  }
}

import { Module } from '@nestjs/common';
import { Task9Service } from './task9.service';
import { Task9Controller } from './task9.controller';

@Module({
  providers: [Task9Service],
  controllers: [Task9Controller]
})
export class Task9Module {}

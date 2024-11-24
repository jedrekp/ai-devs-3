import { Module } from '@nestjs/common';
import { Task14Service } from './task14.service';
import { Task14Controller } from './task14.controller';

@Module({
  providers: [Task14Service],
  controllers: [Task14Controller]
})
export class Task14Module {}

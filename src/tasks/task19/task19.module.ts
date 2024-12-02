import { Module } from '@nestjs/common';
import { Task19Service } from './task19.service';
import { Task19Controller } from './task19.controller';

@Module({
  providers: [Task19Service],
  controllers: [Task19Controller]
})
export class Task19Module {}

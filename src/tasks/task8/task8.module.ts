import { Module } from '@nestjs/common';
import { Task8Service } from './task8.service';
import { Task8Controller } from './task8.controller';

@Module({
  providers: [Task8Service],
  controllers: [Task8Controller]
})
export class Task8Module {}

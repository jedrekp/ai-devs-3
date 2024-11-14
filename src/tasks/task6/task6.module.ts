import { Module } from '@nestjs/common';
import { Task6Service } from './task6.service';
import { Task6Controller } from './task6.controller';

@Module({
  providers: [Task6Service],
  controllers: [Task6Controller]
})
export class Task6Module {}

import { Module } from '@nestjs/common';
import { Task5Controller } from './task5.controller';
import { Task5Service } from './task5.service';

@Module({
  controllers: [Task5Controller],
  providers: [Task5Service]
})
export class Task5Module {}

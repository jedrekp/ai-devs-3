import { Module } from '@nestjs/common';
import { Task10Service } from './task10.service';
import { Task10Controller } from './task10.controller';

@Module({
  providers: [Task10Service],
  controllers: [Task10Controller]
})
export class Task10Module {}

import { Module } from '@nestjs/common';
import { Task13Service } from './task13.service';
import { Task13Controller } from './task13.controller';

@Module({
  providers: [Task13Service],
  controllers: [Task13Controller]
})
export class Task13Module {}

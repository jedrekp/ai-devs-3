import { Module } from '@nestjs/common';
import { Task11Controller } from './task11.controller';
import { Task11Service } from './task11.service';

@Module({
  providers: [Task11Service],
  controllers: [Task11Controller]
})
export class Task11Module {}

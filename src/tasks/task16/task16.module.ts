import { Module } from '@nestjs/common';
import { Task16Service } from './task16.service';
import { Task16Controller } from './task16.controller';

@Module({
  providers: [Task16Service],
  controllers: [Task16Controller]
})
export class Task16Module {}

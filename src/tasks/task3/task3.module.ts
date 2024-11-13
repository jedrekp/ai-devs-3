import { Module } from '@nestjs/common';
import { Task3Controller } from './task3.controller';
import { Task3Service } from './task3.service';

@Module({
  controllers: [Task3Controller],
  providers: [Task3Service],
})
export class Task3Module {}

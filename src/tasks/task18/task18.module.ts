import { Module } from '@nestjs/common';
import { Task18Service } from './task18.service';
import { Task18Controller } from './task18.controller';

@Module({
  providers: [Task18Service],
  controllers: [Task18Controller]
})
export class Task18Module {}

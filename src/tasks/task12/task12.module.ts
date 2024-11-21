import { Module } from '@nestjs/common';
import { Task12Service } from './task12.service';
import { Task12Controller } from './task12.controller';

@Module({
  providers: [Task12Service],
  controllers: [Task12Controller]
})
export class Task12Module {}

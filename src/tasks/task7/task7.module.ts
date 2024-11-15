import { Module } from '@nestjs/common';
import { Task7Service } from './task7.service';
import { Task7Controller } from './task7.controller';

@Module({
  providers: [Task7Service],
  controllers: [Task7Controller]
})
export class Task7Module {}

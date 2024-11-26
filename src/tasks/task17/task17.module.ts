import { Module } from '@nestjs/common';
import { Task17Service } from './task17.service';
import { Task17Controller } from './task17.controller';

@Module({
  providers: [Task17Service],
  controllers: [Task17Controller]
})
export class Task17Module {}

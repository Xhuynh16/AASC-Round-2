import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Line98Controller } from './line98.controller';
import { Line98Service } from './line98.service';
import { Line98Game } from './entities/line98-game.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Line98Game]), AuthModule],
  controllers: [Line98Controller],
  providers: [Line98Service],
})
export class Line98Module {}

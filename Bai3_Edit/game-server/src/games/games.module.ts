import { Module } from '@nestjs/common';
import { Line98Module } from './line98/line98.module';
import { TictactoeModule } from './tictactoe/tictactoe.module';
import { GamesController } from './games.controller';

@Module({
  imports: [Line98Module, TictactoeModule],
  controllers: [GamesController],
})
export class GamesModule {} 
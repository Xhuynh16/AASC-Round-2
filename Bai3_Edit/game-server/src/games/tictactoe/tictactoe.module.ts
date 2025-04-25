import { Module } from '@nestjs/common';
import { TictactoeController } from './tictactoe.controller';
import { TictactoeGateway } from './tictactoe.gateway';
import { TictactoeService } from './tictactoe.service';

@Module({
  controllers: [TictactoeController],
  providers: [TictactoeGateway, TictactoeService],
})
export class TictactoeModule {} 
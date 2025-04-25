import { Controller, Get, Render, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('games')
export class GamesController {
  @UseGuards(JwtAuthGuard)
  @Get()
  @Render('games/index')
  listGames(@Req() req: Request) {
    return {
      title: 'Available Games',
      stylesheets: '',
      scripts: '',
      user: (req.session as any)?.user || null,
      success: null,
      error: null,
      games: [
        { id: 'line98', name: 'Line 98', description: 'Classic Line 98 game', path: '/games/line98' },
        { id: 'tictactoe', name: 'Tic Tac Toe', description: 'Classic X and O game', path: '/games/tictactoe' },
      ]
    };
  }
} 
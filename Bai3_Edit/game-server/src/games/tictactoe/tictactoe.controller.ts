import { Controller, Get, Render, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('games/tictactoe')
export class TictactoeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  @Render('games/tictactoe/index')
  index(@Req() req: Request) {
    return {
      title: 'Tic-tac-toe',
      stylesheets: '',
      scripts: '',
      user: (req.session as any)?.user || null,
      success: null,
      error: null
    };
  }
} 
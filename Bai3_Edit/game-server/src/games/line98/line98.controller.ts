import { Controller, Get, Render, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('games/line98')
export class Line98Controller {
  @UseGuards(JwtAuthGuard)
  @Get()
  @Render('games/line98/index')
  index(@Req() req: Request) {
    return {
      title: 'Line 98',
      stylesheets: '',
      scripts: '',
      user: (req.session as any)?.user || null,
      success: null,
      error: null
    };
  }
} 
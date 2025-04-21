import { Controller, Post, Body, UseGuards, Req, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CaroService } from './caro.service';
import { JoinCaroGameDto } from './dto/join.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number;
    username: string;
  };
}

@Controller('caro')
export class CaroController {
  constructor(private readonly caroService: CaroService) {}

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async joinGame(@Body() joinDto: JoinCaroGameDto, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.caroService.joinGame(userId, joinDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('games/:id')
  async getGame(@Param('id', ParseIntPipe) id: number) {
    return this.caroService.getGameById(id);
  }
}

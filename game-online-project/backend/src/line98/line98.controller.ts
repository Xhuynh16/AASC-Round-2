import { Controller, Post, Get, Body, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { Line98Service } from './line98.service';
import { StartDto } from './dto/start.dto';
import { MoveDto } from './dto/move.dto';
import { HintResponseDto } from './dto/hint.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Line98Game } from './entities/line98-game.entity';
import { Request } from 'express';
import { FindPathDto } from './dto/find-path.dto';

// Define the user type from JWT payload
interface RequestWithUser extends Request {
  user: {
    sub: number;
    username: string;
  };
}

@Controller('line98')
@UseGuards(JwtAuthGuard)
export class Line98Controller {
  constructor(private readonly line98Service: Line98Service) {}

  @Post('start')
  async startGame(@Req() req: RequestWithUser, @Body() startDto: StartDto): Promise<Line98Game> {
    const userId = req.user.sub;
    return this.line98Service.startGame(userId, startDto);
  }

  @Post('move/:id')
  async moveBall(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() moveDto: MoveDto,
  ): Promise<Line98Game> {
    const userId = req.user.sub;
    return this.line98Service.moveBall(userId, id, moveDto);
  }

  @Get('hint/:id')
  async getHint(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HintResponseDto> {
    const userId = req.user.sub;
    return this.line98Service.getHint(userId, id);
  }

  @Get(':id')
  async getGame(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Line98Game> {
    const userId = req.user.sub;
    return this.line98Service.findGameById(id, userId);
  }

  @Post('find-path/:id')
  async findPath(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() pathDto: FindPathDto,
  ) {
    return this.line98Service.findPathForClient(
      req.user.sub,
      id,
      pathDto.fromRow,
      pathDto.fromCol,
      pathDto.toRow,
      pathDto.toCol,
    );
  }
}

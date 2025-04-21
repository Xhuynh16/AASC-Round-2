import { IsOptional, IsNumber } from 'class-validator';

export class JoinCaroGameDto {
  @IsOptional()
  @IsNumber()
  gameId?: number;
}

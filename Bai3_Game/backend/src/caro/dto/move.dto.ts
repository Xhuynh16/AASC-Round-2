import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class MoveDto {
  @IsNotEmpty()
  @IsNumber()
  gameId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(14) // For a 15x15 board
  x: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(14) // For a 15x15 board
  y: number;
}

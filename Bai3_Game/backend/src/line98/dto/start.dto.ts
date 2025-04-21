import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class StartDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10)
  gridSize?: number = 9; // Default to 9x9 grid

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  colorCount?: number = 5; // Default to 5 colors

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  initialBallCount?: number = 3; // Default to 3 balls
}

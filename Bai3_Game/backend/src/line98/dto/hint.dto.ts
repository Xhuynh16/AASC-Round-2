import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class HintResponseDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(8)
  fromRow: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(8)
  fromCol: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(8)
  toRow: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(8)
  toCol: number;
}

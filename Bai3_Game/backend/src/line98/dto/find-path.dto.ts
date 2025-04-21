import { IsInt, Min, Max } from 'class-validator';

export class FindPathDto {
  @IsInt()
  @Min(0)
  @Max(8)
  fromRow: number;

  @IsInt()
  @Min(0)
  @Max(8)
  fromCol: number;

  @IsInt()
  @Min(0)
  @Max(8)
  toRow: number;

  @IsInt()
  @Min(0)
  @Max(8)
  toCol: number;
}

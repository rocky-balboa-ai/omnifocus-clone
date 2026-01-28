import { IsOptional, IsEnum, IsUUID, IsBoolean, IsDateString, IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ItemStatus } from '@prisma/client';

export class ActionQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  q?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  tagId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  flagged?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  inbox?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;
}

export class SearchActionDto {
  @IsString()
  @MinLength(1)
  q: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

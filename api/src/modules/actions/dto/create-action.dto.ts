import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { RepeatMode } from '@prisma/client';

export class CreateActionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  flagged?: boolean;

  @IsOptional()
  @IsDateString()
  deferDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsEnum(RepeatMode)
  repeatMode?: RepeatMode;

  @IsOptional()
  @IsString()
  repeatInterval?: string;

  @IsOptional()
  @IsDateString()
  repeatEndDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  repeatEndCount?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

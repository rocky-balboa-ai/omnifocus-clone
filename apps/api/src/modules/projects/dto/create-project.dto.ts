import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  IsInt,
} from 'class-validator';
import { ProjectType, RepeatMode } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

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
  @IsString()
  reviewInterval?: string;

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
  repeatEndCount?: number;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

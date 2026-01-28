import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus } from '@prisma/client';
import { CreateActionDto } from './create-action.dto';

export class UpdateActionDto extends PartialType(CreateActionDto) {
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedBy?: string[];  // IDs of actions that must complete before this one
}

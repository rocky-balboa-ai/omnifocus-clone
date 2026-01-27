import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ItemStatus } from '@prisma/client';
import { CreateActionDto } from './create-action.dto';

export class UpdateActionDto extends PartialType(CreateActionDto) {
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}

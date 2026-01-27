import { IsString, IsOptional, IsUUID, IsInt, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:MM format' })
  availableFrom?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:MM format' })
  availableUntil?: string;
}

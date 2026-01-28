import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FilterRuleDto {
  @IsString()
  field: string;

  @IsString()
  operator: string;

  @IsOptional()
  value?: string | number | boolean;
}

class SortRuleDto {
  @IsString()
  field: string;

  @IsString()
  direction: 'asc' | 'desc';
}

export class CreatePerspectiveDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterRuleDto)
  filterRules?: FilterRuleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortRuleDto)
  sortRules?: SortRuleDto[];

  @IsOptional()
  @IsString()
  groupBy?: string;
}

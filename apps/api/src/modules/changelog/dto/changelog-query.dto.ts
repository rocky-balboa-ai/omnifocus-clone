import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangelogQueryDto {
  @IsDateString()
  since: string;

  @IsOptional()
  @IsString()
  actor?: string; // 'fred' | 'rocky' | 'all'

  @IsOptional()
  @IsString()
  entityType?: string; // 'action' | 'project' | 'tag' | 'folder'

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

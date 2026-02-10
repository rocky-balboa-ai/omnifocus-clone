import { IsString, MinLength } from 'class-validator';

export class UpdateBotSettingsDto {
  @IsString()
  @MinLength(1)
  botName: string;
}

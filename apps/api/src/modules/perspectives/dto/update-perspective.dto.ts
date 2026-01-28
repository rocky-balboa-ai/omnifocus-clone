import { PartialType } from '@nestjs/mapped-types';
import { CreatePerspectiveDto } from './create-perspective.dto';

export class UpdatePerspectiveDto extends PartialType(CreatePerspectiveDto) {}

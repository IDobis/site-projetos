import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { PROJECT_STATUSES } from '../project.types';
import { emptyToNull, normalizeTags, trimString } from './transforms';
import { IsProjectName } from './validators';

export class UpdateProjectDto {
  @IsOptional()
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsProjectName()
  name?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({ message: 'A descrição deve ser um texto.' })
  description?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Informe uma URL válida, com http:// ou https://.' },
  )
  url?: string | null;

  @IsOptional()
  @IsIn(PROJECT_STATUSES, { message: 'Escolha um status válido.' })
  status?: (typeof PROJECT_STATUSES)[number];

  @IsOptional()
  @Transform(normalizeTags)
  @IsArray({ message: 'As tags devem ser uma lista.' })
  @IsString({ each: true, message: 'Cada tag deve ser um texto.' })
  tags?: string[];
}

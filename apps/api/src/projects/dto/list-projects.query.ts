import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PROJECT_STATUSES, ProjectStatus } from '../project.types';

export class ListProjectsQueryDto {
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  q?: string;

  @IsOptional()
  @IsString({ message: 'A tag deve ser um texto.' })
  tag?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES, { message: 'Escolha um status válido.' })
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O tamanho da página deve ser um número inteiro.' })
  @Min(1, { message: 'O tamanho da página deve ser maior ou igual a 1.' })
  @Max(100, { message: 'O tamanho da página deve ser no máximo 100.' })
  pageSize?: number;
}

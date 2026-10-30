import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects.query';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectList } from './project.types';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query() query: ListProjectsQueryDto): ProjectList {
    return this.projects.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Project {
    return this.projects.get(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateProjectDto): Project {
    return this.projects.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto): Project {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.projects.remove(id);
  }
}

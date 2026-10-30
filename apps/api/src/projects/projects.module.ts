import { Module } from '@nestjs/common';
import { DATABASE, openDatabase, resolveDatabasePath } from '../database/sqlite';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectsRepository,
    {
      provide: DATABASE,
      useFactory: () => openDatabase(resolveDatabasePath()),
    },
  ],
})
export class ProjectsModule {}

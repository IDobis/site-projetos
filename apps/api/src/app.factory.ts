import 'reflect-metadata';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { validationFields } from './common/validation-fields';

class ValidationException extends BadRequestException {
  constructor(body: {
    error: {
      code: 'VALIDATION_ERROR';
      message: string;
      fields?: Record<string, string>;
    };
  }) {
    super(body);
  }
}

export async function createApp(options?: { logger?: false }): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: options?.logger === false ? false : ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const fields = validationFields(errors);
        const body: {
          error: {
            code: 'VALIDATION_ERROR';
            message: string;
            fields?: Record<string, string>;
          };
        } = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos.',
          },
        };
        if (Object.keys(fields).length > 0) {
          body.error.fields = fields;
        }
        return new ValidationException(body);
      },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  return app;
}

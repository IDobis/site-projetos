import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object' || !('error' in value)) return false;
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== 'object') return false;
  const record = error as { code?: unknown; message?: unknown };
  return typeof record.code === 'string' && typeof record.message === 'string';
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (isApiErrorBody(body)) {
        this.logIfServerError(status, exception);
        response.status(status).json(body);
        return;
      }

      if (status === HttpStatus.BAD_REQUEST) {
        response.status(HttpStatus.BAD_REQUEST).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos.',
          },
        });
        return;
      }

      if (status === HttpStatus.NOT_FOUND) {
        response.status(HttpStatus.NOT_FOUND).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Projeto não encontrado.',
          },
        });
        return;
      }
    }

    this.logServerError(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno.',
      },
    });
  }

  private logIfServerError(status: number, exception: unknown): void {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception);
    }
  }

  private logServerError(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      return;
    }
    this.logger.error('Erro interno.');
  }
}

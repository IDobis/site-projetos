import { HttpException, HttpStatus } from '@nestjs/common';

export function projectNotFound(): never {
  throw new HttpException(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Projeto não encontrado.',
      },
    },
    HttpStatus.NOT_FOUND,
  );
}

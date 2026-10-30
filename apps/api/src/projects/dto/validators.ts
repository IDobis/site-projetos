import { ValidateBy, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsProjectName(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isProjectName',
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && value.length > 0 && value.length <= 120;
        },
        defaultMessage(args: ValidationArguments): string {
          if (typeof args.value !== 'string' || args.value.length === 0) {
            return 'Informe o nome.';
          }
          return 'O nome deve ter no máximo 120 caracteres.';
        },
      },
    },
    validationOptions,
  );
}

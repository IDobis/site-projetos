import { ValidationError } from 'class-validator';

export function validationFields(errors: ValidationError[]): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    const message = firstMessage(error);
    if (message && !fields[error.property]) {
      fields[error.property] = message;
    }
  }

  return fields;
}

function firstMessage(error: ValidationError): string | undefined {
  if (error.constraints) {
    const message = Object.values(error.constraints)[0];
    if (message) return message;
  }

  for (const child of error.children ?? []) {
    const message = firstMessage(child);
    if (message) return message;
  }

  return undefined;
}

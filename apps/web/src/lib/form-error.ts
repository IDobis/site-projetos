export type FormFailure = {
  fields: Record<string, string>;
  message: string;
};

const failures = new Map<string, FormFailure>();

export function stashFormFailure(key: string, failure: FormFailure) {
  failures.set(key, failure);
}

export function peekFormFailure(key: string): FormFailure | null {
  return failures.get(key) ?? null;
}

export function clearFormFailure(key: string) {
  failures.delete(key);
}

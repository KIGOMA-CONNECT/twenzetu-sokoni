import { ValueTransformer } from 'typeorm';

/**
 * Postgres drivers return NUMERIC/DECIMAL columns as strings, which silently
 * corrupts arithmetic like `balance += amount` (string concatenation).
 * This transformer hydrates decimal columns as JS numbers.
 */
export const decimalNumber: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | number | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};

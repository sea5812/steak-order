// Input validation helper functions

import { AppError } from '../errors/app-error.js';

export function validatePositiveInteger(value: unknown, fieldName: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new AppError(
      400,
      `INVALID_${fieldName.toUpperCase().replace(/\s+/g, '_')}`,
      `${fieldName}은(는) 1 이상의 정수여야 합니다`
    );
  }
  return num;
}

export function validateEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fieldName: string
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new AppError(
      400,
      `INVALID_${fieldName.toUpperCase().replace(/\s+/g, '_')}`,
      `유효하지 않은 ${fieldName}입니다. 허용 값: ${allowed.join(', ')}`
    );
  }
  return value as T;
}

export function validateDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(
      400,
      'INVALID_DATE_FORMAT',
      `${fieldName}은(는) YYYY-MM-DD 형식이어야 합니다`
    );
  }
  return value;
}

export function validateRequiredString(
  value: unknown,
  fieldName: string,
  minLength: number = 1
): string {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new AppError(
      400,
      `INVALID_${fieldName.toUpperCase().replace(/\s+/g, '_')}`,
      `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다`
    );
  }
  return value.trim();
}

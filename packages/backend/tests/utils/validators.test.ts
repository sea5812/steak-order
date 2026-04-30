import { describe, it, expect } from 'vitest';
import { validatePositiveInteger, validateEnum, validateDateString, validateRequiredString } from '../../src/utils/validators.js';
import { AppError } from '../../src/errors/app-error.js';

describe('validatePositiveInteger', () => {
  it('should return number for valid positive integer', () => {
    expect(validatePositiveInteger(5, 'test')).toBe(5);
    expect(validatePositiveInteger('3', 'test')).toBe(3);
    expect(validatePositiveInteger(1, 'test')).toBe(1);
  });

  it('should throw AppError for zero', () => {
    expect(() => validatePositiveInteger(0, 'test')).toThrow(AppError);
  });

  it('should throw AppError for negative number', () => {
    expect(() => validatePositiveInteger(-1, 'test')).toThrow(AppError);
  });

  it('should throw AppError for non-integer', () => {
    expect(() => validatePositiveInteger(1.5, 'test')).toThrow(AppError);
    expect(() => validatePositiveInteger('abc', 'test')).toThrow(AppError);
    expect(() => validatePositiveInteger(null, 'test')).toThrow(AppError);
  });
});

describe('validateEnum', () => {
  it('should return value for valid enum', () => {
    expect(validateEnum('pending', ['pending', 'preparing', 'completed'], 'status')).toBe('pending');
  });

  it('should throw AppError for invalid enum value', () => {
    expect(() => validateEnum('invalid', ['pending', 'preparing'], 'status')).toThrow(AppError);
  });

  it('should throw AppError for non-string', () => {
    expect(() => validateEnum(123, ['pending'], 'status')).toThrow(AppError);
  });
});

describe('validateDateString', () => {
  it('should return date string for valid format', () => {
    expect(validateDateString('2026-04-30', 'date')).toBe('2026-04-30');
  });

  it('should throw AppError for invalid format', () => {
    expect(() => validateDateString('2026/04/30', 'date')).toThrow(AppError);
    expect(() => validateDateString('20260430', 'date')).toThrow(AppError);
    expect(() => validateDateString('', 'date')).toThrow(AppError);
  });
});

describe('validateRequiredString', () => {
  it('should return trimmed string for valid input', () => {
    expect(validateRequiredString('hello', 'test')).toBe('hello');
    expect(validateRequiredString('  hello  ', 'test')).toBe('hello');
  });

  it('should throw AppError for empty string', () => {
    expect(() => validateRequiredString('', 'test')).toThrow(AppError);
    expect(() => validateRequiredString('   ', 'test')).toThrow(AppError);
  });

  it('should enforce minimum length', () => {
    expect(() => validateRequiredString('ab', 'test', 4)).toThrow(AppError);
    expect(validateRequiredString('abcd', 'test', 4)).toBe('abcd');
  });
});

import { describe, it, expect } from 'vitest';
import { generateOrderNumber, getTodayDateString } from '../../src/utils/order-number.js';

describe('generateOrderNumber', () => {
  it('should generate first order number of the day', () => {
    const result = generateOrderNumber(undefined, '20260430');
    expect(result).toBe('20260430-001');
  });

  it('should increment from last order number', () => {
    const result = generateOrderNumber('20260430-005', '20260430');
    expect(result).toBe('20260430-006');
  });

  it('should reset to 001 for new day', () => {
    const result = generateOrderNumber('20260429-050', '20260430');
    expect(result).toBe('20260430-001');
  });

  it('should handle three-digit sequence numbers', () => {
    const result = generateOrderNumber('20260430-099', '20260430');
    expect(result).toBe('20260430-100');
  });

  it('should pad sequence number to 3 digits', () => {
    const result = generateOrderNumber('20260430-001', '20260430');
    expect(result).toBe('20260430-002');
  });
});

describe('getTodayDateString', () => {
  it('should return YYYYMMDD format', () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{8}$/);
  });
});

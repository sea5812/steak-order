import { describe, it, expect } from 'vitest';
import { withRetry } from '../../src/utils/retry.js';

describe('withRetry', () => {
  it('should return result on first successful attempt', () => {
    const result = withRetry(() => 42);
    expect(result).toBe(42);
  });

  it('should throw non-BUSY errors immediately without retry', () => {
    let attempts = 0;
    expect(() => {
      withRetry(() => {
        attempts++;
        throw new Error('Some other error');
      });
    }).toThrow('Some other error');
    expect(attempts).toBe(1);
  });

  it('should retry on SQLITE_BUSY error up to maxRetries', () => {
    let attempts = 0;
    expect(() => {
      withRetry(() => {
        attempts++;
        throw new Error('SQLITE_BUSY: database is locked');
      }, 2, 10);
    }).toThrow('SQLITE_BUSY');
    expect(attempts).toBe(3); // initial + 2 retries
  });

  it('should succeed after BUSY error if subsequent attempt succeeds', () => {
    let attempts = 0;
    const result = withRetry(() => {
      attempts++;
      if (attempts < 2) {
        throw new Error('SQLITE_BUSY: database is locked');
      }
      return 'success';
    }, 2, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });
});

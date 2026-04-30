// Transaction retry utility for SQLite BUSY errors

function isSQLiteBusyError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('SQLITE_BUSY');
}

export function withRetry<T>(
  fn: () => T,
  maxRetries: number = 2,
  delayMs: number = 100
): T {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error;
      if (isSQLiteBusyError(error)) {
        const start = Date.now();
        while (Date.now() - start < delayMs) {
          // busy wait for synchronous better-sqlite3
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unreachable');
}

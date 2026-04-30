// Order number generation utility
// Format: YYYYMMDD-NNN (date-based sequential number, daily reset)

export function generateOrderNumber(
  lastOrderNumber: string | undefined,
  today: string // YYYYMMDD format
): string {
  if (!lastOrderNumber || !lastOrderNumber.startsWith(today)) {
    return `${today}-001`;
  }

  const parts = lastOrderNumber.split('-');
  const seq = parseInt(parts[1], 10);
  const nextSeq = (seq + 1).toString().padStart(3, '0');
  return `${today}-${nextSeq}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

export function getNowISO(): string {
  return new Date().toISOString();
}

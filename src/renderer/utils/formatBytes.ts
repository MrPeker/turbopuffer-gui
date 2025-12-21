/**
 * Formats bytes into human-readable format using SI units (1000-based).
 * Examples: 1500 → "1.50 KB", 1500000 → "1.50 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '-' + formatBytes(-bytes);

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let unitIndex = 0;

  while (bytes >= 1000 && unitIndex < units.length - 1) {
    bytes /= 1000;
    unitIndex++;
  }

  // Use 2 decimal places for values < 10, 1 decimal for >= 10
  const decimals = bytes >= 10 ? 1 : 2;
  return `${bytes.toFixed(decimals)} ${units[unitIndex]}`;
}

/**
 * Formats a number with locale-aware thousand separators.
 * Examples: 1234567 → "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats a date string or Date object into a readable format.
 * Examples: "2025-01-15T10:30:00Z" → "Jan 15, 2025"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

import { describe, it, expect } from 'vitest';
import { formatBytes, formatNumber, formatDate } from '../formatBytes';

describe('formatBytes', () => {
  describe('basic conversions', () => {
    it('formats 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats bytes less than 1000', () => {
      expect(formatBytes(500)).toBe('500.0 B');
    });

    it('formats exactly 1 KB (1000 bytes)', () => {
      expect(formatBytes(1000)).toBe('1.00 KB');
    });

    it('formats 1.5 KB', () => {
      expect(formatBytes(1500)).toBe('1.50 KB');
    });

    it('formats 1 MB (1,000,000 bytes)', () => {
      expect(formatBytes(1000000)).toBe('1.00 MB');
    });

    it('formats 1.5 MB', () => {
      expect(formatBytes(1500000)).toBe('1.50 MB');
    });

    it('formats 1 GB', () => {
      expect(formatBytes(1000000000)).toBe('1.00 GB');
    });

    it('formats 1 TB', () => {
      expect(formatBytes(1000000000000)).toBe('1.00 TB');
    });

    it('formats 1 PB', () => {
      expect(formatBytes(1000000000000000)).toBe('1.00 PB');
    });
  });

  describe('decimal precision', () => {
    it('uses 2 decimal places for values < 10', () => {
      expect(formatBytes(5500)).toBe('5.50 KB');
    });

    it('uses 1 decimal place for values >= 10', () => {
      expect(formatBytes(15000)).toBe('15.0 KB');
    });

    it('uses 1 decimal place for larger values', () => {
      expect(formatBytes(123456789)).toBe('123.5 MB');
    });
  });

  describe('negative values', () => {
    it('handles negative bytes with minus sign', () => {
      expect(formatBytes(-1500)).toBe('-1.50 KB');
    });

    it('handles negative zero', () => {
      expect(formatBytes(-0)).toBe('0 B');
    });
  });

  describe('edge cases', () => {
    it('handles very large values (petabytes+)', () => {
      const result = formatBytes(5000000000000000);
      expect(result).toBe('5.00 PB');
    });

    it('handles fractional bytes', () => {
      expect(formatBytes(0.5)).toBe('0.50 B');
    });
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    const result = formatNumber(1234567);
    expect(result).toMatch(/1.234.567|1,234,567/);
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1234);
    expect(result).toMatch(/-1.234|-1,234/);
  });

  it('handles decimal numbers', () => {
    const result = formatNumber(1234.56);
    expect(result).toMatch(/1.234,56|1,234\.56/);
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toBe('Jan 15, 2025');
  });

  it('formats Date object', () => {
    const date = new Date(2025, 0, 15);
    const result = formatDate(date);
    expect(result).toBe('Jan 15, 2025');
  });

  it('handles different months correctly', () => {
    expect(formatDate('2025-06-20')).toBe('Jun 20, 2025');
    expect(formatDate('2025-12-25')).toBe('Dec 25, 2025');
  });
});

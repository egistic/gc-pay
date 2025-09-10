/**
 * Number formatting utilities
 */

/**
 * Format number with space as thousands separator and 2 decimal places
 * @param value - The number to format
 * @param currency - Optional currency code to append
 * @returns Formatted number string
 */
export function formatNumber(value: number | string, currency?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,00';
  }

  // Format with 2 decimal places and space as thousands separator
  const formatted = numValue.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  });

  // Replace comma with space for thousands separator (ru-RU uses space, but let's be explicit)
  const withSpaceSeparator = formatted.replace(/\s/g, ' ');

  return currency ? `${withSpaceSeparator} ${currency}` : withSpaceSeparator;
}

/**
 * Format currency amount with space separator and 2 decimal places
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'KZT')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency: string = 'KZT'): string {
  return formatNumber(amount, currency);
}

/**
 * Format percentage with 2 decimal places
 * @param value - The percentage value (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,00%';
  }

  return `${formatNumber(numValue)}%`;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param value - The number to format
 * @param currency - Optional currency code
 * @returns Formatted number with suffix
 */
export function formatLargeNumber(value: number | string, currency?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,00';
  }

  const absValue = Math.abs(numValue);
  
  if (absValue >= 1_000_000_000) {
    const formatted = (numValue / 1_000_000_000).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return currency ? `${formatted} млрд ${currency}` : `${formatted} млрд`;
  } else if (absValue >= 1_000_000) {
    const formatted = (numValue / 1_000_000).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return currency ? `${formatted} млн ${currency}` : `${formatted} млн`;
  } else if (absValue >= 1_000) {
    const formatted = (numValue / 1_000).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return currency ? `${formatted} тыс ${currency}` : `${formatted} тыс`;
  }
  
  return formatNumber(numValue, currency);
}

/**
 * Safe date formatting utility
 * Handles invalid dates gracefully and provides consistent formatting
 */

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Format a date string safely, returning a fallback for invalid dates
 * @param dateString - The date string to format
 * @param formatString - The format string (default: 'dd.MM.yyyy')
 * @returns Formatted date string or fallback text
 */
export const formatDateSafe = (
  dateString: string | undefined | null,
  formatString: string = 'dd.MM.yyyy'
): string => {
  if (!dateString) {
    return 'Не указано';
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }

    return format(date, formatString, { locale: ru });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Ошибка даты';
  }
};

/**
 * Format a date for display in tables and lists
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string | undefined | null): string => {
  return formatDateSafe(dateString, 'dd.MM.yyyy');
};

/**
 * Format a date with time for detailed views
 * @param dateString - The date string to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string | undefined | null): string => {
  return formatDateSafe(dateString, 'dd.MM.yyyy HH:mm');
};

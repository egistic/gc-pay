/**
 * Overdue date checking utility
 * Determines if a date is overdue based on current date
 */

/**
 * Check if a date is overdue
 * @param dateString - The date string to check
 * @returns True if the date is overdue, false otherwise
 */
export const isOverdue = (dateString: string | undefined | null): boolean => {
  if (!dateString) {
    return false;
  }

  try {
    const date = new Date(dateString);
    const today = new Date();
    
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    return date < today;
  } catch (error) {
    console.warn('Error checking overdue date:', error);
    return false;
  }
};

/**
 * Get the number of days until a date
 * @param dateString - The date string to check
 * @returns Number of days until the date (negative if overdue)
 */
export const getDaysUntil = (dateString: string | undefined | null): number => {
  if (!dateString) {
    return 0;
  }

  try {
    const date = new Date(dateString);
    const today = new Date();
    
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 0;
    }

    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Error calculating days until date:', error);
    return 0;
  }
};

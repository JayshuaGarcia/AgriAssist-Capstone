/**
 * Date utility functions for formatting and handling dates
 */

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date as a string
 */
export const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 * @param dateString - Date string to parse
 * @returns Date object
 */
export const parseISODate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Format a date string for display
 * @param dateString - Date string to format
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};



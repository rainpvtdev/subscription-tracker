/**
 * Utility functions for handling data transformations between frontend and backend
 * Ensures snake_case database fields work properly with the frontend
 */

/**
 * Ensures all form data uses snake_case naming to match database field naming
 * This prevents issues where camelCase frontend data wouldn't map correctly to snake_case DB fields
 */
export function prepareFormDataForSubmission(data: Record<string, any>): Record<string, any> {
  // We don't need to convert snake_case to camelCase since our backend uses snake_case
  return {
    ...data,
    // Ensure these specific fields use snake_case naming
    reminder_days: data.reminder_days !== undefined ? data.reminder_days : data.reminderDays,
    email_notifications: data.email_notifications !== undefined ? data.email_notifications : data.emailNotifications,
    // Add any other fields that need to be ensured as snake_case
  };
}

/**
 * Optimizes API responses by removing unnecessary nested data
 * and ensuring consistent field naming
 */
export function optimizeApiResponse<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // For arrays, process each item
  if (Array.isArray(data)) {
    return data.map(item => optimizeApiResponse(item)) as unknown as T;
  }
  
  // Perform any needed optimizations on object data
  // We don't convert snake_case to camelCase since our frontend now uses snake_case consistently
  return data;
}

/**
 * Chunks large data arrays to improve rendering performance
 * @param array The array to chunk
 * @param size Chunk size (default: 10)
 */
export function chunkArray<T>(array: T[], size: number = 10): T[][] {
  if (!array.length) return [];
  
  return Array(Math.ceil(array.length / size))
    .fill(null)
    .map((_, index) => array.slice(index * size, (index + 1) * size));
}

/**
 * Debounce function to limit the rate at which a function can fire
 * Useful for search inputs and other frequently changing values
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait) as unknown as number;
  };
}

/**
 * Utility functions for conversation title handling
 */

/**
 * Truncates a message to a reasonable length for use as a conversation title
 * @param message The original message
 * @param maxLength Maximum length for the title (default: 100)
 * @returns Truncated title with ellipsis if needed
 */
export function truncateTitle(message: string, maxLength: number = 100): string {
  if (!message || message.length <= maxLength) {
    return message;
  }
  
  // Find the last space before the max length to avoid cutting words
  const truncated = message.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If we found a space and it's not too close to the beginning, use it
  if (lastSpaceIndex > maxLength * 0.7) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  // Otherwise, just truncate at the max length
  return truncated + '...';
}

/**
 * Sanitizes a title by removing excessive whitespace and newlines
 * @param title The title to sanitize
 * @returns Sanitized title
 */
export function sanitizeTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Creates a conversation title from a message
 * @param message The original message
 * @param maxLength Maximum length for the title (default: 100)
 * @returns Processed title ready for storage
 */
export function createConversationTitle(message: string, maxLength: number = 100): string {
  const sanitized = sanitizeTitle(message);
  return truncateTitle(sanitized, maxLength);
}

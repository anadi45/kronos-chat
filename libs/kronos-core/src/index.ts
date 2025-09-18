/**
 * @kronos/core
 * 
 * Core types and utilities for the Kronos chat application.
 * 
 * This package provides modular access to:
 * - Types: All TypeScript interfaces and type definitions
 * - Utils: Common utility functions for validation, formatting, and API handling
 * 
 * Usage:
 * ```typescript
 * // Import everything
 * import { User, ChatMessage, formatDate, StreamEventFactory } from '@kronos/core';
 * 
 * // Import specific modules
 * import { User, ChatMessage } from '@kronos/core/types';
 * import { formatDate, validateEmail } from '@kronos/core/utils';
 * ```
 */

// Re-export all modules for convenience
export * from './types/index';
export * from './utils/index';

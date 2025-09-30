/**
 * @quark/core
 * 
 * Core types and utilities for the Quark chat application.
 * 
 * This package provides modular access to:
 * - Types: All TypeScript interfaces and type definitions
 * - Utils: Common utility functions for validation, formatting, and API handling
 * 
 * Usage:
 * ```typescript
 * // Import everything
 * import { User, ChatMessage, formatDate, StreamEventFactory } from '@quark/core';
 * 
 * // Import specific modules
 * import { User, ChatMessage } from '@quark/core/types';
 * import { formatDate, validateEmail } from '@quark/core/utils';
 * ```
 */

// Re-export all modules for convenience
export * from './types/index';
export * from './utils/index';

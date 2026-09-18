/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generates a standard RFC4122 v4 compliant UUID
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if browser security context limits crypto.randomUUID
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validates whether a string is a valid UUID format
 */
export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Ensures the returned ID is guaranteed to be a valid PostgreSQL UUID
 */
export function ensureUUID(id?: string | null): string {
  if (id && isValidUUID(id)) {
    return id.trim();
  }
  return generateUUID();
}

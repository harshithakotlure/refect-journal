// Storage service for managing localStorage operations

import { STORAGE_KEYS } from '../../config';
import { safeJsonParse } from '../../utils';
import type { JournalEntry, AuditLogEntry } from '../../types';

/**
 * Save journal entries to localStorage
 */
export function saveEntries(entries: JournalEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save entries:', error);
    return false;
  }
}

/**
 * Load journal entries from localStorage
 */
export function loadEntries(): JournalEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? safeJsonParse<JournalEntry[]>(data, []) : [];
  } catch (error) {
    console.error('Failed to load entries:', error);
    return [];
  }
}

/**
 * Save a hash of the passphrase for verification
 */
export async function savePassphraseHash(passphrase: string): Promise<void> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(STORAGE_KEYS.PASSPHRASE_HASH, hashHex);
}

/**
 * Verify if a passphrase matches the stored hash
 */
export async function verifyPassphrase(passphrase: string): Promise<boolean> {
  const storedHash = localStorage.getItem(STORAGE_KEYS.PASSPHRASE_HASH);
  if (!storedHash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === storedHash;
}

/**
 * Check if a passphrase has been set up
 */
export function hasPassphrase(): boolean {
  return localStorage.getItem(STORAGE_KEYS.PASSPHRASE_HASH) !== null;
}

/**
 * Clear all data from localStorage
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.PASSPHRASE_HASH);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
}

/**
 * Save audit log entries
 */
export function saveAuditLog(logs: AuditLogEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Failed to save audit log:', error);
    return false;
  }
}

/**
 * Load audit log entries
 */
export function loadAuditLog(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return data ? safeJsonParse<AuditLogEntry[]>(data, []) : [];
  } catch (error) {
    console.error('Failed to load audit log:', error);
    return [];
  }
}

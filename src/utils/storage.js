/**
 * Storage utilities for encrypted journal entries
 */

const STORAGE_KEY = 'reflect_journal_entries';
const PASSPHRASE_HASH_KEY = 'reflect_passphrase_hash';

/**
 * Save encrypted entries to localStorage
 */
export function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save entries:', error);
    return false;
  }
}

/**
 * Load encrypted entries from localStorage
 */
export function loadEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load entries:', error);
    return [];
  }
}

/**
 * Save a hash of the passphrase for verification (not the passphrase itself)
 */
export async function savePassphraseHash(passphrase) {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(PASSPHRASE_HASH_KEY, hashHex);
}

/**
 * Check if a passphrase matches the stored hash
 */
export async function verifyPassphrase(passphrase) {
  const storedHash = localStorage.getItem(PASSPHRASE_HASH_KEY);
  if (!storedHash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === storedHash;
}

/**
 * Check if passphrase has been set up
 */
export function hasPassphrase() {
  return localStorage.getItem(PASSPHRASE_HASH_KEY) !== null;
}

/**
 * Clear all data (for testing/reset)
 */
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PASSPHRASE_HASH_KEY);
}

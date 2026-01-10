/**
 * Web Crypto API utilities for AES-256-GCM encryption with PBKDF2 key derivation
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-256-GCM
 * @returns {Promise<{encrypted: string, salt: string, iv: string}>}
 */
export async function encryptText(text, passphrase) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt);

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  // Convert to base64 for storage
  return {
    encrypted: arrayBufferToBase64(encryptedData),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt text using AES-256-GCM
 * @returns {Promise<string>}
 */
export async function decryptText(encryptedData, passphrase) {
  const { encrypted, salt, iv } = encryptedData;

  // Convert from base64
  const encryptedBuffer = base64ToArrayBuffer(encrypted);
  const saltBuffer = base64ToArrayBuffer(salt);
  const ivBuffer = base64ToArrayBuffer(iv);

  // Derive key from passphrase
  const key = await deriveKey(passphrase, saltBuffer);

  try {
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encryptedBuffer
    );

    // Convert back to text
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Failed to decrypt: incorrect passphrase or corrupted data');
  }
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a preview of encrypted data (for demo purposes)
 */
export function getEncryptedPreview(encryptedData) {
  return {
    encrypted: encryptedData.encrypted.substring(0, 50) + '...',
    salt: encryptedData.salt.substring(0, 20) + '...',
    iv: encryptedData.iv.substring(0, 20) + '...',
  };
}

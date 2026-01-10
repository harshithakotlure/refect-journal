// Encryption service using Web Crypto API

import { ENCRYPTION_CONFIG } from '../../config';
import type { EncryptedData } from '../../types';

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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
      iterations: ENCRYPTION_CONFIG.ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: ENCRYPTION_CONFIG.ALGORITHM, length: ENCRYPTION_CONFIG.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-256-GCM
 */
export async function encryptText(text: string, passphrase: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));

  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt);

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.ALGORITHM,
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
 */
export async function decryptText(encryptedData: EncryptedData, passphrase: string): Promise<string> {
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
        name: ENCRYPTION_CONFIG.ALGORITHM,
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
function arrayBufferToBase64(buffer: ArrayBuffer): string {
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
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Application configuration constants

import type { MoodConfig, MoodType } from '../types';

// Encryption configuration
export const ENCRYPTION_CONFIG = {
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  ITERATIONS: 100000,
  ALGORITHM: 'AES-GCM' as const,
  KEY_LENGTH: 256,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ENTRIES: 'reflect_journal_entries',
  PASSPHRASE_HASH: 'reflect_passphrase_hash',
  AUDIT_LOG: 'reflect_audit_log',
} as const;

// Mood configurations
export const MOODS: Record<MoodType, MoodConfig> = {
  great: {
    emoji: '😊',
    label: 'Great',
    color: '#10b981',
    bgColor: 'from-green-50 to-green-100',
    borderColor: 'border-green-300',
  },
  good: {
    emoji: '🙂',
    label: 'Good',
    color: '#3b82f6',
    bgColor: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
  },
  okay: {
    emoji: '😐',
    label: 'Okay',
    color: '#6b7280',
    bgColor: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
  },
  down: {
    emoji: '😔',
    label: 'Down',
    color: '#a855f7',
    bgColor: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-300',
  },
  stressed: {
    emoji: '😰',
    label: 'Stressed',
    color: '#f97316',
    bgColor: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-300',
  },
};

// Audit log configuration
export const AUDIT_CONFIG = {
  MAX_LOG_ENTRIES: 100,
  REFRESH_INTERVAL: 2000, // ms
} as const;

// UI configuration
export const UI_CONFIG = {
  ENTRY_PREVIEW_LENGTH: 50,
  ANIMATION_DURATION: 300, // ms
} as const;

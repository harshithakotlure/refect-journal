// Audit logging service

import { AUDIT_CONFIG, STORAGE_KEYS } from '../../config';
import { generateId, safeJsonParse } from '../../utils';
import type { AuditLogEntry, AuditAction } from '../../types';

/**
 * Log an action to the audit trail
 */
export function logAction(action: AuditAction, details: string = ''): boolean {
  try {
    const logs = getAuditLog();
    
    const logEntry: AuditLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      action,
      details,
    };

    logs.unshift(logEntry);
    const trimmedLogs = logs.slice(0, AUDIT_CONFIG.MAX_LOG_ENTRIES);

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(trimmedLogs));
    return true;
  } catch (error) {
    console.error('Failed to log action:', error);
    return false;
  }
}

/**
 * Get all audit log entries
 */
export function getAuditLog(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return data ? safeJsonParse<AuditLogEntry[]>(data, []) : [];
  } catch (error) {
    console.error('Failed to load audit log:', error);
    return [];
  }
}

/**
 * Get recent audit log entries
 */
export function getRecentLogs(count: number = 20): AuditLogEntry[] {
  const logs = getAuditLog();
  return logs.slice(0, count);
}

/**
 * Clear all audit logs
 */
export function clearAuditLog(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    return true;
  } catch (error) {
    console.error('Failed to clear audit log:', error);
    return false;
  }
}

/**
 * Get formatted action label
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    entry_created: '📝 Entry Created',
    entry_viewed: '👁️ Entry Viewed',
    entry_deleted: '🗑️ Entry Deleted',
    ai_called: '🤖 AI Called',
    app_unlocked: '🔓 App Unlocked',
    app_locked: '🔒 App Locked',
    passphrase_created: '🔑 Passphrase Created',
    passphrase_changed: '🔄 Passphrase Changed',
    data_exported: '📤 Data Exported',
    data_deleted: '⚠️ All Data Deleted',
  };
  
  return labels[action] || action;
}

/**
 * Format timestamp for display
 */
export function formatLogTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

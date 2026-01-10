/**
 * Audit logging utilities for tracking user actions
 */

const AUDIT_LOG_KEY = 'reflect_audit_log';
const MAX_LOG_ENTRIES = 100; // Keep last 100 entries

/**
 * Log an action to the audit trail
 */
export function logAction(action, details = '') {
  try {
    const logs = getAuditLog();
    
    const logEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      action,
      details,
    };

    // Add new entry at the beginning
    logs.unshift(logEntry);

    // Keep only the most recent entries
    const trimmedLogs = logs.slice(0, MAX_LOG_ENTRIES);

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmedLogs));
    
    return true;
  } catch (error) {
    console.error('Failed to log action:', error);
    return false;
  }
}

/**
 * Get all audit log entries
 */
export function getAuditLog() {
  try {
    const data = localStorage.getItem(AUDIT_LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load audit log:', error);
    return [];
  }
}

/**
 * Get recent audit log entries (default: last 20)
 */
export function getRecentLogs(count = 20) {
  const logs = getAuditLog();
  return logs.slice(0, count);
}

/**
 * Clear all audit logs
 */
export function clearAuditLog() {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear audit log:', error);
    return false;
  }
}

/**
 * Get formatted action label
 */
export function getActionLabel(action) {
  const labels = {
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
export function formatLogTimestamp(timestamp) {
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

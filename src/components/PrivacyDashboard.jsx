import { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Database, 
  Activity, 
  Download, 
  Trash2, 
  Key, 
  CheckCircle, 
  XCircle,
  AlertTriangle 
} from 'lucide-react';
import { getRecentLogs, formatLogTimestamp, getActionLabel, clearAuditLog, logAction } from '../utils/audit';
import { loadEntries, clearAllData } from '../utils/storage';

export default function PrivacyDashboard({ onClose, onChangePassphrase, onDataDeleted }) {
  const [logs, setLogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataSize, setDataSize] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [moodCount, setMoodCount] = useState(0);

  useEffect(() => {
    // Load audit logs
    setLogs(getRecentLogs(20));

    // Calculate data size and mood count
    const entries = loadEntries();
    setEntryCount(entries.length);
    
    // Count entries with mood data
    const entriesWithMood = entries.filter(entry => entry.mood).length;
    setMoodCount(entriesWithMood);
    
    const dataStr = JSON.stringify(entries);
    const sizeInBytes = new Blob([dataStr]).size;
    setDataSize(sizeInBytes);

    // Auto-refresh logs every 2 seconds
    const interval = setInterval(() => {
      setLogs(getRecentLogs(20));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatDataSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleExportData = () => {
    const entries = loadEntries();
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reflect-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Log export action
    logAction('data_exported', `Exported ${entries.length} encrypted entries`);
  };

  const handleDeleteAll = () => {
    clearAllData();
    clearAuditLog();
    setShowDeleteConfirm(false);
    onDataDeleted();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 via-secondary-900/50 to-primary-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-effect rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 glass-effect border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Privacy Dashboard</h2>
              <p className="text-sm text-gray-500">Monitor your data and security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 smooth-transition"
          >
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Data Inventory */}
          <section className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-800">Data Inventory</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Entries Stored</div>
                <div className="text-2xl font-bold text-primary-700">{entryCount}</div>
              </div>
              
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Data Size</div>
                <div className="text-2xl font-bold text-secondary-700">{formatDataSize(dataSize)}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Mood Data Points</div>
                <div className="text-2xl font-bold text-purple-700">{moodCount}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Encryption Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">AES-256-GCM</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Last Backup</div>
                <div className="text-sm font-semibold text-gray-700">Never</div>
              </div>
            </div>
          </section>

          {/* Security Status */}
          <section className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Security Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Encryption Algorithm</div>
                  <div className="text-sm text-gray-600">AES-256-GCM (Galois/Counter Mode)</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Key Derivation</div>
                  <div className="text-sm text-gray-600">PBKDF2 with 100,000 iterations</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Storage Location</div>
                  <div className="text-sm text-gray-600">Local device only (localStorage)</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Cloud Sync</div>
                  <div className="text-sm text-gray-600">Disabled (Maximum Privacy)</div>
                </div>
              </div>
            </div>
          </section>

          {/* Access Log */}
          <section className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-secondary-600" />
              <h3 className="text-lg font-semibold text-gray-800">Access Log</h3>
              <span className="text-sm text-gray-500">(Last 20 events)</span>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activity logged yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-gray-100 hover:border-primary-200 smooth-transition"
                  >
                    <div className="text-xs text-gray-500 font-mono min-w-[80px]">
                      {formatLogTimestamp(log.timestamp)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">
                        {getActionLabel(log.action)}
                      </div>
                      {log.details && (
                        <div className="text-xs text-gray-600 mt-1">{log.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Data Controls */}
          <section className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Data Controls</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 smooth-transition font-medium"
              >
                <Download className="w-4 h-4" />
                Export All Data
              </button>
              
              <button
                onClick={onChangePassphrase}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 smooth-transition font-medium"
              >
                <Key className="w-4 h-4" />
                Change Passphrase
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 smooth-transition font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="glass-effect rounded-2xl p-6 max-w-md w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Delete All Data?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>All {entryCount} journal entries</li>
                <li>Your passphrase</li>
                <li>All audit logs</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 smooth-transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 smooth-transition font-medium"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

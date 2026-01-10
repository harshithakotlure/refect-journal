import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import PassphraseModal from './components/PassphraseModal';
import UnlockModal from './components/UnlockModal';
import EntryEditor from './components/EntryEditor';
import EntriesList from './components/EntriesList';
import InsightsDashboard from './components/InsightsDashboard';
import ChangePassphraseModal from './components/ChangePassphraseModal';
import { encryptText, decryptText } from './utils/crypto';
import { 
  saveEntries, 
  loadEntries, 
  savePassphraseHash, 
  verifyPassphrase, 
  hasPassphrase 
} from './utils/storage';
import { logAction } from './utils/audit';

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [entries, setEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showInsightsDashboard, setShowInsightsDashboard] = useState(false);
  const [showChangePassphrase, setShowChangePassphrase] = useState(false);

  useEffect(() => {
    // Check if passphrase has been set up
    setIsSetup(hasPassphrase());
    
    // Load entries
    const loadedEntries = loadEntries();
    setEntries(loadedEntries);
  }, []);

  const handleSetPassphrase = async (newPassphrase) => {
    await savePassphraseHash(newPassphrase);
    setPassphrase(newPassphrase);
    setIsSetup(true);
    setIsUnlocked(true);
    logAction('passphrase_created', 'Initial passphrase setup completed');
  };

  const handleUnlock = async (enteredPassphrase) => {
    const isValid = await verifyPassphrase(enteredPassphrase);
    if (isValid) {
      setPassphrase(enteredPassphrase);
      setIsUnlocked(true);
      logAction('app_unlocked', 'Journal unlocked successfully');
      return true;
    }
    return false;
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassphrase('');
    logAction('app_locked', 'Journal locked for security');
  };

  const handleSaveEntry = async (entryData) => {
    setIsSaving(true);
    
    try {
      const { content, mood } = entryData;
      
      // Encrypt the content
      const encryptedData = await encryptText(content, passphrase);
      
      // Create new entry
      const newEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        encryptedData: encryptedData,
        mood: mood, // Store mood separately (not encrypted for filtering)
      };

      // Add to entries list
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      // Save to storage
      saveEntries(updatedEntries);
      setLastSaved(Date.now());

      // Get mood emoji for logging
      const moodEmojis = { great: '😊', good: '🙂', okay: '😐', down: '😔', stressed: '😰' };
      const moodEmoji = moodEmojis[mood] || '';

      // Log action to audit trail
      logAction('entry_created', `Entry created (${content.length} characters, mood: ${moodEmoji} ${mood})`);

      // Log encrypted data to console for demo purposes
      console.log('📝 Entry saved with encryption:');
      console.log('Mood:', mood, moodEmoji);
      console.log('Encrypted data:', encryptedData.encrypted.substring(0, 100) + '...');
      console.log('Salt:', encryptedData.salt);
      console.log('IV:', encryptedData.iv);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassphrase = async (oldPassphrase, newPassphrase) => {
    try {
      // Decrypt all entries with old passphrase
      const decryptedEntries = [];
      for (const entry of entries) {
        const decryptedContent = await decryptText(entry.encryptedData, oldPassphrase);
        decryptedEntries.push({
          ...entry,
          decryptedContent
        });
      }

      // Re-encrypt all entries with new passphrase
      const reEncryptedEntries = [];
      for (const entry of decryptedEntries) {
        const encryptedData = await encryptText(entry.decryptedContent, newPassphrase);
        reEncryptedEntries.push({
          id: entry.id,
          timestamp: entry.timestamp,
          encryptedData
        });
      }

      // Save re-encrypted entries
      saveEntries(reEncryptedEntries);
      setEntries(reEncryptedEntries);

      // Update passphrase hash
      await savePassphraseHash(newPassphrase);
      setPassphrase(newPassphrase);

      // Log action
      logAction('passphrase_changed', `All ${entries.length} entries re-encrypted`);

      // Close modal
      setShowChangePassphrase(false);
      alert('Passphrase changed successfully! All entries have been re-encrypted.');
    } catch (error) {
      console.error('Failed to change passphrase:', error);
      alert('Failed to change passphrase. Please try again.');
    }
  };

  const handleDataDeleted = () => {
    // Reset app state
    setEntries([]);
    setIsSetup(false);
    setIsUnlocked(false);
    setPassphrase('');
    setShowInsightsDashboard(false);
    logAction('data_deleted', 'All data permanently deleted');
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = Date.now();
    const diff = Math.floor((now - lastSaved) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return new Date(lastSaved).toLocaleDateString();
  };

  // Show setup modal if not set up
  if (!isSetup) {
    return <PassphraseModal onSetPassphrase={handleSetPassphrase} />;
  }

  // Show unlock modal if not unlocked
  if (!isUnlocked) {
    return <UnlockModal onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Reflect
                </h1>
                <p className="text-sm text-gray-500">Secure Journal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInsightsDashboard(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 smooth-transition shadow-md hover:shadow-lg"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Insights</span>
              </button>
              
              <button
                onClick={handleLock}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-white/80 smooth-transition border border-gray-200 text-gray-700 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Entry Editor - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <EntryEditor onSave={handleSaveEntry} isSaving={isSaving} />
          </div>

          {/* Entries List - Takes 1 column on large screens */}
          <div className="lg:col-span-1 h-[600px]">
            <EntriesList 
              entries={entries} 
              passphrase={passphrase}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <footer className="glass-effect rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700 font-medium">{entries.length}</span>
                <span className="text-gray-500">{entries.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-500">Last saved:</span>
                <span className="text-gray-700 font-medium">{formatLastSaved()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs">AES-256-GCM Encrypted</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Insights Dashboard */}
      {showInsightsDashboard && (
        <InsightsDashboard
          onClose={() => setShowInsightsDashboard(false)}
          onChangePassphrase={() => {
            setShowInsightsDashboard(false);
            setShowChangePassphrase(true);
          }}
          onDataDeleted={handleDataDeleted}
        />
      )}

      {/* Change Passphrase Modal */}
      {showChangePassphrase && (
        <ChangePassphraseModal
          onClose={() => setShowChangePassphrase(false)}
          onChangePassphrase={handleChangePassphrase}
        />
      )}
    </div>
  );
}

export default App;

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
import { THEMES, getStoredTheme, setStoredTheme } from './themes';

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [entries, setEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showInsightsDashboard, setShowInsightsDashboard] = useState(false);
  const [showChangePassphrase, setShowChangePassphrase] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());

  // Handle theme changes
  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    setStoredTheme(themeName);
  };

  // Get current theme colors
  const theme = THEMES[currentTheme];

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
    <div 
      className="min-h-screen p-4 md:p-8 transition-colors duration-200"
      style={{ backgroundColor: theme.colors.page }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header - Minimal */}
        <header 
          className="rounded-lg p-4 mb-5 border transition-colors duration-200"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: theme.colors.accent }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-base font-semibold transition-colors duration-200"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Reflect
                </h1>
                <p 
                  className="text-[10px] transition-colors duration-200"
                  style={{ color: theme.colors.textTertiary }}
                >
                  Private journal
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowInsightsDashboard(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md smooth-transition border text-xs font-medium transition-colors duration-200"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.borderHover}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.border}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Insights</span>
              </button>
              
              <button
                onClick={handleLock}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md smooth-transition border text-xs transition-colors duration-200"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textSecondary
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.borderHover}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.border}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {/* Entry Editor - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <EntryEditor 
              onSave={handleSaveEntry} 
              isSaving={isSaving}
              theme={theme}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </div>

          {/* Entries List - Takes 1 column on large screens */}
          <div className="lg:col-span-1 h-[600px]">
            <EntriesList 
              entries={entries} 
              passphrase={passphrase}
              theme={theme}
            />
          </div>
        </div>

        {/* Footer Stats - Minimal */}
        <footer 
          className="rounded-lg p-3 border transition-colors duration-200"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg 
                  className="w-3 h-3 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: theme.colors.textTertiary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span 
                  className="font-medium transition-colors duration-200"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {entries.length}
                </span>
                <span 
                  className="transition-colors duration-200"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <svg 
                  className="w-3 h-3 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: theme.colors.textTertiary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span 
                  className="transition-colors duration-200"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {formatLastSaved()}
                </span>
              </div>
            </div>

            <div 
              className="flex items-center gap-1 transition-colors duration-200"
              style={{ color: theme.colors.textTertiary }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px]">Encrypted</span>
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

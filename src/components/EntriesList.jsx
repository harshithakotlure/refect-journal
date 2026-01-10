import { useState, useMemo } from 'react';
import { decryptText } from '../utils/crypto';
import { logAction } from '../utils/audit';

const MOODS = {
  great: { emoji: '😊', label: 'Great', bgColor: 'bg-white', borderColor: 'border-[#e9e9e7]' },
  good: { emoji: '🙂', label: 'Good', bgColor: 'bg-white', borderColor: 'border-[#e9e9e7]' },
  okay: { emoji: '😐', label: 'Okay', bgColor: 'bg-white', borderColor: 'border-[#e9e9e7]' },
  down: { emoji: '😔', label: 'Down', bgColor: 'bg-white', borderColor: 'border-[#e9e9e7]' },
  stressed: { emoji: '😰', label: 'Stressed', bgColor: 'bg-white', borderColor: 'border-[#e9e9e7]' },
};

export default function EntriesList({ entries, passphrase, onViewEntry, theme }) {
  const [expandedId, setExpandedId] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [moodFilter, setMoodFilter] = useState('all');

  const handleEntryClick = async (entry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(entry.id);
    
    if (!decryptedContent[entry.id]) {
      setIsDecrypting(true);
      try {
        const decrypted = await decryptText(entry.encryptedData, passphrase);
        setDecryptedContent(prev => ({ ...prev, [entry.id]: decrypted }));
        
        // Log entry view action
        const date = new Date(entry.timestamp).toLocaleDateString();
        logAction('entry_viewed', `Entry from ${date} decrypted and viewed`);
      } catch (error) {
        console.error('Decryption failed:', error);
        setDecryptedContent(prev => ({ ...prev, [entry.id]: 'Failed to decrypt entry' }));
      }
      setIsDecrypting(false);
    }
  };

  const getPreview = (entry) => {
    if (decryptedContent[entry.id]) {
      return decryptedContent[entry.id].substring(0, 50);
    }
    return '🔒 Encrypted entry';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Filter entries by mood
  const filteredEntries = useMemo(() => {
    if (moodFilter === 'all') return entries;
    return entries.filter(entry => entry.mood === moodFilter);
  }, [entries, moodFilter]);

  if (entries.length === 0) {
    return (
      <div 
        className="rounded-lg p-5 h-full flex flex-col items-center justify-center text-center border transition-colors duration-200"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div 
          className="w-10 h-10 rounded-md flex items-center justify-center mb-2 border transition-colors duration-200"
          style={{
            backgroundColor: theme.colors.surfaceHover,
            borderColor: theme.colors.border
          }}
        >
          <svg 
            className="w-5 h-5 transition-colors duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: theme.colors.textTertiary }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 
          className="text-sm font-medium mb-0.5 transition-colors duration-200"
          style={{ color: theme.colors.textPrimary }}
        >
          No entries yet
        </h3>
        <p 
          className="text-xs transition-colors duration-200"
          style={{ color: theme.colors.textTertiary }}
        >
          Start writing your first entry
        </p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-5 h-full flex flex-col border transition-colors duration-200"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div 
        className="flex items-center justify-between mb-3 pb-3 border-b transition-colors duration-200"
        style={{ borderColor: theme.colors.border }}
      >
        <h2 
          className="text-base font-semibold transition-colors duration-200"
          style={{ color: theme.colors.textPrimary }}
        >
          Entries
        </h2>

        {/* Mood Filter Dropdown */}
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          className="text-xs px-2 py-1 rounded-md border outline-none smooth-transition transition-colors duration-200"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textSecondary
          }}
          onFocus={(e) => e.target.style.borderColor = theme.colors.borderHover}
          onBlur={(e) => e.target.style.borderColor = theme.colors.border}
        >
          <option value="all">All moods</option>
          {Object.entries(MOODS).map(([value, mood]) => (
            <option key={value} value={value}>
              {mood.emoji} {mood.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {filteredEntries.map((entry) => {
          const moodData = MOODS[entry.mood] || MOODS.okay;
          return (
          <div
            key={entry.id}
            onClick={() => handleEntryClick(entry)}
            className="p-3 rounded-md border smooth-transition cursor-pointer transition-colors duration-200"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: expandedId === entry.id ? theme.colors.borderHover : theme.colors.border
            }}
            onMouseEnter={(e) => {
              if (expandedId !== entry.id) {
                e.currentTarget.style.borderColor = theme.colors.borderHover;
              }
            }}
            onMouseLeave={(e) => {
              if (expandedId !== entry.id) {
                e.currentTarget.style.borderColor = theme.colors.border;
              }
            }}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{moodData.emoji}</span>
                <div 
                  className="text-[10px] font-medium transition-colors duration-200"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {formatDate(entry.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {expandedId === entry.id && (
                  <svg 
                    className="w-3 h-3 transition-colors duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>

            {expandedId === entry.id ? (
              <div 
                className="whitespace-pre-wrap text-sm leading-relaxed transition-colors duration-200"
                style={{ color: theme.colors.textPrimary }}
              >
                {isDecrypting ? (
                  <div 
                    className="flex items-center gap-1.5 transition-colors duration-200"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Decrypting...</span>
                  </div>
                ) : (
                  decryptedContent[entry.id] || 'Loading...'
                )}
              </div>
            ) : (
              <div 
                className="text-xs leading-relaxed transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
              >
                {getPreview(entry)}
                {getPreview(entry).length >= 50 && '...'}
              </div>
            )}

            {/* Show encrypted data preview in DevTools */}
            {expandedId === entry.id && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-[#9b9a97] hover:text-[#787774] text-[10px]">
                  View encrypted
                </summary>
                <div className="mt-1.5 p-2 bg-[#fafafa] rounded-sm font-mono text-[9px] overflow-x-auto border border-[#e9e9e7]">
                  <div className="text-[#787774] break-all">Encrypted: {entry.encryptedData.encrypted.substring(0, 60)}...</div>
                  <div className="text-[#787774] break-all mt-0.5">Salt: {entry.encryptedData.salt}</div>
                  <div className="text-[#787774] break-all mt-0.5">IV: {entry.encryptedData.iv}</div>
                </div>
              </details>
            )}
          </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && entries.length > 0 && (
        <div 
          className="text-center py-6 text-xs transition-colors duration-200"
          style={{ color: theme.colors.textTertiary }}
        >
          No entries for this mood
        </div>
      )}
    </div>
  );
}

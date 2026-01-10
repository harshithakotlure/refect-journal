import { useState, useMemo } from 'react';
import { decryptText } from '../utils/crypto';
import { logAction } from '../utils/audit';

const MOODS = {
  great: { emoji: '😊', label: 'Great', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-300' },
  good: { emoji: '🙂', label: 'Good', bgColor: 'from-blue-50 to-blue-100', borderColor: 'border-blue-300' },
  okay: { emoji: '😐', label: 'Okay', bgColor: 'from-gray-50 to-gray-100', borderColor: 'border-gray-300' },
  down: { emoji: '😔', label: 'Down', bgColor: 'from-purple-50 to-purple-100', borderColor: 'border-purple-300' },
  stressed: { emoji: '😰', label: 'Stressed', bgColor: 'from-orange-50 to-orange-100', borderColor: 'border-orange-300' },
};

export default function EntriesList({ entries, passphrase, onViewEntry }) {
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
      <div className="glass-effect rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No entries yet</h3>
        <p className="text-gray-500 text-sm">Start writing your first journal entry</p>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Your Entries
        </h2>

        {/* Mood Filter Dropdown */}
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none smooth-transition"
        >
          <option value="all">All Moods</option>
          {Object.entries(MOODS).map(([value, mood]) => (
            <option key={value} value={value}>
              {mood.emoji} {mood.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filteredEntries.map((entry) => {
          const moodData = MOODS[entry.mood] || MOODS.okay;
          return (
          <div
            key={entry.id}
            onClick={() => handleEntryClick(entry)}
            className={`p-4 rounded-lg border smooth-transition cursor-pointer ${
              expandedId === entry.id
                ? `bg-gradient-to-br ${moodData.bgColor} ${moodData.borderColor} shadow-md`
                : `bg-gradient-to-br ${moodData.bgColor} border-gray-200 hover:${moodData.borderColor} hover:shadow-md opacity-80 hover:opacity-100`
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{moodData.emoji}</span>
                <div className="text-xs font-medium text-gray-500">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {expandedId === entry.id && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>

            {expandedId === entry.id ? (
              <div className="text-gray-700 whitespace-pre-wrap">
                {isDecrypting ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Decrypting...
                  </div>
                ) : (
                  decryptedContent[entry.id] || 'Loading...'
                )}
              </div>
            ) : (
              <div className="text-gray-600 text-sm">
                {getPreview(entry)}
                {getPreview(entry).length >= 50 && '...'}
              </div>
            )}

            {/* Show encrypted data preview in DevTools */}
            {expandedId === entry.id && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                  View encrypted data (DevTools)
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs overflow-x-auto">
                  <div className="text-gray-500">Encrypted: {entry.encryptedData.encrypted.substring(0, 60)}...</div>
                  <div className="text-gray-500">Salt: {entry.encryptedData.salt}</div>
                  <div className="text-gray-500">IV: {entry.encryptedData.iv}</div>
                </div>
              </details>
            )}
          </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && entries.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No entries found with this mood filter
        </div>
      )}
    </div>
  );
}

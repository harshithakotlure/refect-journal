// Journal Context for global state management

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { JournalEntry, MoodType } from '../types';
import { loadEntries, saveEntries } from '../services/storage';
import { encryptText } from '../services/encryption';
import { logAction } from '../services/audit';

interface JournalContextType {
  entries: JournalEntry[];
  isLoading: boolean;
  addEntry: (content: string, mood: MoodType, passphrase: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  refreshEntries: () => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load entries on mount
    const loadedEntries = loadEntries();
    setEntries(loadedEntries);
  }, []);

  const addEntry = async (content: string, mood: MoodType, passphrase: string) => {
    setIsLoading(true);
    try {
      const encryptedData = await encryptText(content, passphrase);
      
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        encryptedData,
        mood,
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      saveEntries(updatedEntries);

      const moodEmojis = { great: '😊', good: '🙂', okay: '😐', down: '😔', stressed: '😰' };
      logAction('entry_created', `Entry created (${content.length} characters, mood: ${moodEmojis[mood]} ${mood})`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    logAction('entry_deleted', `Entry ${entryId} deleted`);
  };

  const refreshEntries = () => {
    const loadedEntries = loadEntries();
    setEntries(loadedEntries);
  };

  return (
    <JournalContext.Provider value={{ entries, isLoading, addEntry, deleteEntry, refreshEntries }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournalContext must be used within JournalProvider');
  }
  return context;
}

// Core data types for the journaling app

export type MoodType = 'great' | 'good' | 'okay' | 'down' | 'stressed';

export interface MoodConfig {
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  encryptedData: EncryptedData;
  mood: MoodType;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  details: string;
}

export type AuditAction =
  | 'entry_created'
  | 'entry_viewed'
  | 'entry_deleted'
  | 'ai_called'
  | 'app_unlocked'
  | 'app_locked'
  | 'passphrase_created'
  | 'passphrase_changed'
  | 'data_exported'
  | 'data_deleted';

export interface JournalingStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  avgLength: number;
  moodDistribution: Record<MoodType, number>;
  bestWritingTime: string;
  mostProductiveDay: string;
}

export interface AIInsight {
  id: string;
  timestamp: number;
  type: 'pattern' | 'suggestion' | 'reflection';
  content: string;
  relatedMoods?: MoodType[];
}

// Component prop types
export interface EntryEditorProps {
  onSave: (entryData: { content: string; mood: MoodType }) => Promise<void>;
  isSaving: boolean;
}

export interface EntriesListProps {
  entries: JournalEntry[];
  passphrase: string;
  onViewEntry?: (entryId: string) => void;
}

export interface InsightsDashboardProps {
  onClose: () => void;
  onChangePassphrase: () => void;
  onDataDeleted: () => void;
}

export interface PassphraseModalProps {
  onSetPassphrase: (passphrase: string) => Promise<void>;
}

export interface UnlockModalProps {
  onUnlock: (passphrase: string) => Promise<boolean>;
}

export interface ChangePassphraseModalProps {
  onClose: () => void;
  onChangePassphrase: (oldPassphrase: string, newPassphrase: string) => Promise<void>;
}

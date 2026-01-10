// Authentication Context for passphrase management

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasPassphrase, verifyPassphrase, savePassphraseHash } from '../services/storage';
import { logAction } from '../services/audit';

interface AuthContextType {
  isSetup: boolean;
  isUnlocked: boolean;
  passphrase: string;
  setupPassphrase: (newPassphrase: string) => Promise<void>;
  unlock: (enteredPassphrase: string) => Promise<boolean>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  useEffect(() => {
    setIsSetup(hasPassphrase());
  }, []);

  const setupPassphrase = async (newPassphrase: string) => {
    await savePassphraseHash(newPassphrase);
    setPassphrase(newPassphrase);
    setIsSetup(true);
    setIsUnlocked(true);
    logAction('passphrase_created', 'Initial passphrase setup completed');
  };

  const unlock = async (enteredPassphrase: string): Promise<boolean> => {
    const isValid = await verifyPassphrase(enteredPassphrase);
    if (isValid) {
      setPassphrase(enteredPassphrase);
      setIsUnlocked(true);
      logAction('app_unlocked', 'Journal unlocked successfully');
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    setPassphrase('');
    logAction('app_locked', 'Journal locked for security');
  };

  return (
    <AuthContext.Provider value={{ isSetup, isUnlocked, passphrase, setupPassphrase, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

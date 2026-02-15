import { Member, MeetingSession, AppSettings } from '../types';

const KEYS = {
  MEMBERS: 'saham_scout_members',
  SESSIONS: 'saham_scout_sessions',
  SETTINGS: 'saham_scout_settings',
};

const defaultSettings: AppSettings = {
  leaderName: 'القائد',
  coordinatorName: '',
  secretaryName: '',
  troopName: 'عشيرة جوالة صحم 2026',
  logoUrl: null,
};

export const Storage = {
  getMembers: (): Member[] => {
    try {
      const data = localStorage.getItem(KEYS.MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  saveMembers: (members: Member[]) => {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  },

  getSessions: (): MeetingSession[] => {
    try {
      const data = localStorage.getItem(KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSessions: (sessions: MeetingSession[]) => {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      // Merge with default settings to ensure new fields are covered
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Backup & Restore Features ---

  getFullBackup: () => {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      members: Storage.getMembers(),
      sessions: Storage.getSessions(),
      settings: Storage.getSettings(),
    };
  },

  restoreBackup: (backupData: any): boolean => {
    try {
      // Basic validation
      if (!backupData || typeof backupData !== 'object') return false;
      
      // Save data if it exists in the backup, otherwise keep existing or empty
      if (Array.isArray(backupData.members)) {
        Storage.saveMembers(backupData.members);
      }
      
      if (Array.isArray(backupData.sessions)) {
        Storage.saveSessions(backupData.sessions);
      }
      
      if (backupData.settings && typeof backupData.settings === 'object') {
        Storage.saveSettings(backupData.settings);
      }
      
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  },

  clearAllData: () => {
    localStorage.removeItem(KEYS.MEMBERS);
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.SETTINGS);
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
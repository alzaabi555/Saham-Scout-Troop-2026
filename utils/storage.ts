import { Member, MeetingSession, AppSettings, Group } from '../types';

const KEYS = {
  MEMBERS: 'saham_scout_members',
  GROUPS: 'saham_scout_groups',
  SESSIONS: 'saham_scout_sessions',
  SETTINGS: 'saham_scout_settings',
};

const defaultSettings: AppSettings = {
  leaderName: 'القائد',
  coordinatorName: '',
  secretaryName: '',
  troopName: 'فرقة جوالة صحم 2026',
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

  getGroups: (): Group[] => {
    try {
      const data = localStorage.getItem(KEYS.GROUPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGroups: (groups: Group[]) => {
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
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
      version: '1.1', // Incremented version for groups support
      timestamp: new Date().toISOString(),
      members: Storage.getMembers(),
      groups: Storage.getGroups(),
      sessions: Storage.getSessions(),
      settings: Storage.getSettings(),
    };
  },

  restoreBackup: (backupData: any): boolean => {
    try {
      if (!backupData || typeof backupData !== 'object') return false;
      
      if (Array.isArray(backupData.members)) {
        Storage.saveMembers(backupData.members);
      }

      if (Array.isArray(backupData.groups)) {
        Storage.saveGroups(backupData.groups);
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
    localStorage.removeItem(KEYS.GROUPS);
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.SETTINGS);
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
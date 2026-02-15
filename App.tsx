import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Members from './components/Members';
import Attendance from './components/Attendance';
import Archive from './components/Archive';
import Settings from './components/Settings';
import { Storage } from './utils/storage';
import { Member, MeetingSession, AppSettings } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState('welcome');
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(Storage.getSettings());

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMembers(Storage.getMembers());
    setSessions(Storage.getSessions());
    setSettings(Storage.getSettings());
  };

  // Handlers
  const handleUpdateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    Storage.saveMembers(newMembers);
  };

  const handleSaveSession = (newSession: MeetingSession) => {
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    Storage.saveSessions(updatedSessions);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    Storage.saveSessions(updatedSessions);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  // Called after a backup file is imported
  const handleDataRestore = () => {
    loadData();
    // Force a small UI feedback or navigation if needed, currently just refreshes state
  };

  // Router logic
  const renderContent = () => {
    switch (currentTab) {
      case 'welcome':
        return <Welcome settings={settings} members={members} sessions={sessions} onNavigate={setCurrentTab} />;
      case 'members':
        return <Members members={members} onUpdateMembers={handleUpdateMembers} />;
      case 'attendance':
        return <Attendance members={members} onSaveSession={handleSaveSession} />;
      case 'archive':
        return <Archive sessions={sessions} members={members} settings={settings} onDeleteSession={handleDeleteSession} />;
      case 'settings':
        return <Settings settings={settings} onSaveSettings={handleUpdateSettings} onDataRestored={handleDataRestore} />;
      default:
        return <Welcome settings={settings} members={members} sessions={sessions} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout activeTab={currentTab} onTabChange={setCurrentTab} settings={settings}>
      {renderContent()}
    </Layout>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Members from './components/Members';
import Attendance from './components/Attendance';
import Archive from './components/Archive';
import Settings from './components/Settings';
import { Storage } from './utils/storage';
import { Member, MeetingSession, AppSettings, Group } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState('welcome');
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(Storage.getSettings());
  const [editingSession, setEditingSession] = useState<MeetingSession | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMembers(Storage.getMembers());
    setGroups(Storage.getGroups());
    setSessions(Storage.getSessions());
    setSettings(Storage.getSettings());
  };

  // Handlers
  const handleUpdateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    Storage.saveMembers(newMembers);
  };

  const handleUpdateGroups = (newGroups: Group[]) => {
    setGroups(newGroups);
    Storage.saveGroups(newGroups);
  };

  const handleSaveSession = (newSession: MeetingSession) => {
    let updatedSessions;
    if (editingSession) {
      updatedSessions = sessions.map(s => s.id === newSession.id ? newSession : s);
      setEditingSession(null);
    } else {
      updatedSessions = [...sessions, newSession];
    }
    setSessions(updatedSessions);
    Storage.saveSessions(updatedSessions);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    Storage.saveSessions(updatedSessions);
  };

  const handleEditSession = (session: MeetingSession) => {
    setEditingSession(session);
    setCurrentTab('attendance');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  const handleDataRestore = () => {
    loadData();
  };

  // Router logic
  const renderContent = () => {
    switch (currentTab) {
      case 'welcome':
        return <Welcome settings={settings} members={members} sessions={sessions} onNavigate={setCurrentTab} />;
      case 'members':
        return (
          <Members 
            members={members} 
            groups={groups}
            sessions={sessions}
            onUpdateMembers={handleUpdateMembers} 
            onUpdateGroups={handleUpdateGroups}
          />
        );
      case 'attendance':
        return <Attendance members={members} groups={groups} onSaveSession={handleSaveSession} initialSession={editingSession} onCancelEdit={() => { setEditingSession(null); setCurrentTab('archive'); }} onUpdateMembers={handleUpdateMembers} />;
      case 'archive':
        return <Archive sessions={sessions} members={members} groups={groups} settings={settings} onDeleteSession={handleDeleteSession} onEditSession={handleEditSession} />;
      case 'settings':
        return <Settings settings={settings} onSaveSettings={handleUpdateSettings} onDataRestored={handleDataRestore} />;
      default:
        return <Welcome settings={settings} members={members} sessions={sessions} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout activeTab={currentTab} onTabChange={(tab) => {
      if (tab !== 'attendance') {
        setEditingSession(null);
      }
      setCurrentTab(tab);
    }} settings={settings}>
      {renderContent()}
    </Layout>
  );
}

export default App;
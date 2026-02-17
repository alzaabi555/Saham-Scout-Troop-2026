import React from 'react';
import { Users, Calendar, Archive, Settings as SettingsIcon, Home, Flag } from 'lucide-react';
import { AppSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: AppSettings;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, settings }) => {
  const navItems = [
    { id: 'welcome', label: 'الرئيسية', icon: Home },
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'attendance', label: 'تحضير', icon: Calendar },
    { id: 'archive', label: 'السجل', icon: Archive },
    { id: 'settings', label: 'إعدادات', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-stone-50 font-sans overflow-hidden">
      
      {/* Top Header - Fixed with Safe Area Padding */}
      <header 
        className="bg-blue-900 text-white shadow-md flex items-center justify-between no-print shrink-0 z-20"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 40px) + 16px)', 
          paddingBottom: '16px',
          paddingLeft: '16px', 
          paddingRight: '16px' 
        }}
      >
        <div className="flex items-center space-x-3 space-x-reverse w-full">
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-700 overflow-hidden flex items-center justify-center shrink-0">
             {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover" /> : <Flag className="w-6 h-6 text-blue-800" />}
            </div>
            <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg leading-tight truncate">{settings.troopName}</h1>
                <p className="text-xs text-blue-300 truncate">القائد: {settings.leaderName}</p>
            </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 p-4 scroll-smooth w-full">
        {children}
      </main>

      {/* Bottom Navigation Bar - Fixed with Safe Area Padding */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 no-print"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)', height: 'calc(4rem + env(safe-area-inset-bottom, 20px))' }}
      >
        <div className="flex justify-around items-center h-16 w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform duration-100
                  ${isActive ? 'text-blue-700' : 'text-stone-400 hover:text-stone-600'}
                `}
              >
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-100' : ''}`}>
                    <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
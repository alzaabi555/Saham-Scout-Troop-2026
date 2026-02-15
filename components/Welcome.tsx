import React from 'react';
import { Users, Calendar, TrendingUp, Award, ChevronLeft } from 'lucide-react';
import { AppSettings, MeetingSession, Member } from '../types';

interface WelcomeProps {
  settings: AppSettings;
  members: Member[];
  sessions: MeetingSession[];
  onNavigate: (tab: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ settings, members, sessions, onNavigate }) => {
  const totalSessions = sessions.length;
  const averageAttendance = totalSessions > 0 
    ? Math.round(
        sessions.reduce((acc, session) => {
          const present = session.records.filter(r => r.status === 'present').length;
          return acc + (present / session.records.length) * 100;
        }, 0) / totalSessions
      )
    : 0;
  
  const lastMeeting = sessions.length > 0 
    ? new Date(sessions[sessions.length - 1].date).toLocaleDateString('ar-OM', { weekday: 'short', day: 'numeric', month: 'short' })
    : '-';

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 transform -translate-x-4 translate-y-4">
          <Award size={140} />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">أهلاً بك!</h1>
          <p className="text-blue-100 text-sm opacity-90 mb-4">
            إحصائيات فرقة {settings.troopName}
          </p>
          <button 
            onClick={() => onNavigate('attendance')}
            className="w-full bg-white text-blue-900 py-3 rounded-xl font-bold shadow-sm active:bg-blue-50 transition-colors flex items-center justify-center"
          >
            <Calendar className="w-5 h-5 ml-2" /> تسجيل حضور جديد
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-full mb-2">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-stone-800">{members.length}</p>
          <p className="text-xs text-stone-500">عدد الجوالة</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-green-100 text-green-600 rounded-full mb-2">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-stone-800">{averageAttendance}%</p>
          <p className="text-xs text-stone-500">نسبة الحضور</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                <Calendar className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-bold text-stone-800">آخر اجتماع</p>
                <p className="text-xs text-stone-500">{lastMeeting}</p>
             </div>
          </div>
          {sessions.length > 0 && (
             <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">
                {sessions.length} جلسات
             </span>
          )}
      </div>

      {/* Recent List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-bold text-stone-800 text-lg">أحدث الجلسات</h2>
          <button onClick={() => onNavigate('archive')} className="text-sm text-blue-600 font-medium">عرض الكل</button>
        </div>
        
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-stone-400 border border-stone-100">
             لا توجد بيانات لعرضها
          </div>
        ) : (
          sessions.slice().reverse().slice(0, 3).map(session => (
            <div key={session.id} onClick={() => onNavigate('archive')} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center active:bg-stone-50">
              <div className="flex items-center space-x-3 space-x-reverse overflow-hidden">
                <div className="w-2 h-10 bg-blue-500 rounded-full shrink-0"></div>
                <div className="truncate">
                    <p className="font-bold text-stone-800 text-sm">
                        {new Date(session.date).toLocaleDateString('ar-OM', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-xs text-stone-500 truncate max-w-[180px]">{session.topic || 'بدون عنوان'}</p>
                </div>
              </div>
              <div className="flex items-center text-stone-400">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md ml-2 font-bold">
                    {session.records.filter(r => r.status === 'present').length}
                </span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Welcome;
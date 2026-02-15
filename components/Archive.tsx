import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Calendar, Printer } from 'lucide-react';
import { Member, MeetingSession, AppSettings } from '../types';

interface ArchiveProps {
  sessions: MeetingSession[];
  members: Member[];
  settings: AppSettings;
  onDeleteSession: (sessionId: string) => void;
}

const Archive: React.FC<ArchiveProps> = ({ sessions, members, settings, onDeleteSession }) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('هل تريد حذف هذا السجل نهائياً؟')) {
      onDeleteSession(id);
    }
  };

  const handlePrint = () => {
    // This triggers the native iOS print dialog
    window.print();
  };

  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Fit to page (Landscape A4 usually handles ~14 columns comfortably)
  const printSessions = sortedSessions.slice(0, 14);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center px-1 sticky top-0 z-10 bg-stone-50 py-2 no-print">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <button 
            onClick={handlePrint}
            className="flex items-center bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:bg-stone-900 transition-colors"
        >
            <Printer className="w-4 h-4 ml-2" />
            طباعة / PDF
        </button>
      </div>

      {sortedSessions.length === 0 ? (
         <div className="text-center py-12 text-stone-400 no-print">
           لا توجد سجلات محفوظة.
         </div>
      ) : (
        <div className="space-y-3 no-print">
        {sortedSessions.map(session => {
            const presentCount = session.records.filter(r => r.status === 'present').length;
            
            return (
            <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div 
                className="p-4 active:bg-stone-50 transition-colors"
                onClick={() => toggleExpand(session.id)}
              >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center text-blue-700 font-bold mb-1">
                            <Calendar className="w-4 h-4 ml-2" />
                            {new Date(session.date).toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        {session.topic && <p className="text-sm text-stone-500 pr-6">{session.topic}</p>}
                    </div>
                    <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-2 text-stone-300 hover:text-red-500"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-50">
                   <div className="flex space-x-2 space-x-reverse">
                       <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">
                           {presentCount} حاضر
                       </span>
                       <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-md">
                           {members.length} إجمالي
                       </span>
                   </div>
                   {expandedSession === session.id ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                </div>
              </div>

              {/* Details Expand */}
              {expandedSession === session.id && (
                <div className="bg-stone-50 p-4 border-t border-stone-100 animate-fade-in">
                  <h4 className="text-xs font-bold text-stone-400 uppercase mb-3">تفاصيل الحضور</h4>
                  <div className="space-y-2">
                    {members.map(member => {
                      const status = getStatus(session, member.id);
                      let icon = <span className="w-2 h-2 rounded-full bg-stone-300"></span>;
                      let textColor = "text-stone-500";
                      
                      if (status === 'present') { 
                          icon = <span className="text-green-600 font-bold">✓</span>; 
                          textColor = "text-green-700";
                      }
                      if (status === 'absent') { 
                          icon = <span className="text-red-500 font-bold">✕</span>; 
                          textColor = "text-red-700";
                      }
                      if (status === 'excused') { 
                          icon = <span className="text-amber-500 font-bold">!</span>; 
                          textColor = "text-amber-700";
                      }

                      return (
                        <div key={member.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-100 text-sm">
                          <span className="font-medium text-stone-700">{member.name}</span>
                          <span className={`flex items-center ${textColor} font-medium`}>{icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            )
        })}
        </div>
      )}
      
      {/* 
          =============================================
          PRINT VIEW / PDF REPORT 
          Visible ONLY when printing (iOS Print Dialog)
          =============================================
      */}
      <div className="hidden print-only bg-white">
         {/* Header */}
         <div className="flex justify-between items-start mb-4 border-b-2 border-stone-800 pb-2">
             <div className="text-right">
                <h2 className="text-[12px] font-bold text-stone-500">سلطنة عمان</h2>
                <h1 className="text-lg font-bold text-black mt-0">{settings.troopName}</h1>
                <p className="text-[10px] text-stone-600">سجل الحضور والغياب لعام 2026</p>
             </div>
             
             {settings.logoUrl && (
                 <div className="w-16 h-16 border border-stone-200 rounded-full overflow-hidden mx-auto">
                    <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                 </div>
             )}

             <div className="text-left">
                 <div className="text-[10px] font-bold text-stone-400">القائد المسؤول</div>
                 <div className="text-[12px] font-bold">{settings.leaderName}</div>
                 <div className="text-[10px] text-stone-500 mt-1">{new Date().toLocaleDateString('ar-OM')}</div>
             </div>
         </div>

         {/* Table */}
         <div className="w-full">
            <table className="w-full border-collapse border border-stone-400 text-[10px] table-fixed">
                <thead>
                <tr className="bg-stone-200 text-stone-800">
                    <th className="border border-stone-400 p-1 w-6 text-center bg-stone-300">#</th>
                    <th className="border border-stone-400 p-1 text-right w-40 bg-stone-300">الاسم الثلاثي</th>
                    
                    {/* Render Session Headers with Day AND Date stacked */}
                    {printSessions.map(s => (
                        <th key={s.id} className="border border-stone-400 p-0 text-center align-middle bg-white w-10">
                            <div className="flex flex-col items-center justify-center h-full py-1">
                                {/* Day Name */}
                                <span className="text-[8px] font-bold text-stone-600 mb-1 leading-none">
                                    {new Date(s.date).toLocaleDateString('ar-OM', { weekday: 'short' })}
                                </span>
                                {/* Date */}
                                <span className="text-[8px] font-bold text-stone-900 border-t border-stone-300 pt-1 w-full block">
                                    {new Date(s.date).toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })}
                                </span>
                            </div>
                        </th>
                    ))}
                    
                    <th className="border border-stone-400 p-1 w-8 bg-stone-100 text-[9px]">حضور</th>
                    <th className="border border-stone-400 p-1 w-8 bg-stone-100 text-[9px]">نسبة</th>
                </tr>
                </thead>
                <tbody>
                {members.map((member, idx) => {
                    const memberSessions = printSessions;
                    const presentCount = memberSessions.filter(s => getStatus(s, member.id) === 'present').length;
                    const percent = memberSessions.length > 0 ? Math.round((presentCount / memberSessions.length) * 100) : 0;
                    
                    return (
                    <tr key={member.id} className="break-inside-avoid odd:bg-white even:bg-stone-50">
                        <td className="border border-stone-400 p-1 text-center font-bold text-stone-500">{idx + 1}</td>
                        <td className="border border-stone-400 p-1 font-bold text-stone-900 whitespace-nowrap overflow-hidden text-ellipsis">{member.name}</td>
                        
                        {memberSessions.map(session => {
                            const st = getStatus(session, member.id);
                            let content = null;
                            let cellClass = "";
                            
                            if (st === 'present') {
                                content = <span className="text-green-800 font-bold text-[10px]">✓</span>;
                                cellClass = "bg-green-50";
                            } else if (st === 'absent') {
                                content = <span className="text-red-600 font-bold text-[10px]">✕</span>;
                                cellClass = "bg-red-50";
                            } else if (st === 'excused') {
                                content = <span className="text-amber-600 font-bold text-[10px]">ع</span>;
                                cellClass = "bg-amber-50";
                            }
                            
                            return (
                                <td key={session.id} className={`border border-stone-400 p-0 text-center align-middle h-6 ${cellClass}`}>
                                    {content}
                                </td>
                            );
                        })}
                        <td className="border border-stone-400 p-1 text-center font-bold">{presentCount}</td>
                        <td className="border border-stone-400 p-1 text-center font-bold bg-stone-100">{percent}%</td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
         </div>

         {/* Legend / Footer */}
         <div className="mt-2 flex items-center justify-between text-[8px] text-stone-600 border-t border-stone-300 pt-1">
             <div className="flex gap-3">
                 <div className="flex items-center"><span className="w-2 h-2 bg-green-50 border border-stone-300 flex items-center justify-center text-[6px] ml-1">✓</span> حاضر</div>
                 <div className="flex items-center"><span className="w-2 h-2 bg-red-50 border border-stone-300 flex items-center justify-center text-[6px] ml-1">✕</span> غائب</div>
                 <div className="flex items-center"><span className="w-2 h-2 bg-amber-50 border border-stone-300 flex items-center justify-center text-[6px] ml-1">ع</span> عذر</div>
             </div>
             <div className="flex gap-10">
                 <div>توقيع القائد: ................................</div>
                 <div>يعتمد، مشرف الجوالة: ................................</div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Archive;
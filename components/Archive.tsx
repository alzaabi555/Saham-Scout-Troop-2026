import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Trash2, Calendar, Printer, FileDown, Loader2, X, FileText } from 'lucide-react';
import { Member, MeetingSession, AppSettings, Group } from '../types';

interface ArchiveProps {
  sessions: MeetingSession[];
  members: Member[];
  groups: Group[];
  settings: AppSettings;
  onDeleteSession: (sessionId: string) => void;
}

const Archive: React.FC<ArchiveProps> = ({ sessions, members, groups, settings, onDeleteSession }) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // New state to handle print mode (Single vs Summary)
  const [printMode, setPrintMode] = useState<'summary' | 'single'>('summary');
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  // --- المنطق ---
  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Determine which sessions to include in the print view
  let sessionsToPrint: MeetingSession[] = [];
  if (printMode === 'single' && targetSessionId) {
      const target = sortedSessions.find(s => s.id === targetSessionId);
      if (target) sessionsToPrint = [target];
  } else {
      sessionsToPrint = sortedSessions.slice(0, 10); // Limit to 10 for summary to fit page
  }

  // Filter members that are not in any group
  const unassignedMembers = members.filter(m => !m.groupId);
  
  // Calculate total columns
  const totalColumns = 2 + sessionsToPrint.length + 2;

  let globalIndex = 0;

  // --- Handlers ---

  const handlePrintSummary = () => {
      setPrintMode('summary');
      setTargetSessionId(null);
      handleSharePDF();
  };

  const handlePrintSingle = (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      setPrintMode('single');
      setTargetSessionId(sessionId);
      handleSharePDF();
  };

  // --- معالج الطباعة والحفظ المتوافق مع iOS ---
  const handleSharePDF = async () => {
    setIsProcessing(true);
    setShowPreview(true);

    setTimeout(async () => {
      const element = document.getElementById('print-content-inner');
      if (!element || !(window as any).html2pdf) {
        alert("جاري تحميل المحرك...");
        setIsProcessing(false);
        return;
      }

      const opt = {
        margin: [10, 5, 10, 5],
        filename: `تقرير_جوالة_صحم_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        const pdfBlob = await (window as any).html2pdf().set(opt).from(element).output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        if (navigator.share) {
          await navigator.share({ files: [file], title: 'تقرير حضور جوالة صحم' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const renderMemberRows = (memberList: Member[]) => {
      return memberList.map((m) => {
          globalIndex++;
          const presentCount = sessionsToPrint.filter(s => getStatus(s, m.id) === 'present').length;
          // Calculate percentage based on displayed sessions
          const percent = sessionsToPrint.length > 0 ? Math.round((presentCount / sessionsToPrint.length) * 100) : 0;
          
          return (
            <tr key={m.id} className="odd:bg-white even:bg-stone-50" style={{ height: '24px' }}>
              <td className="border border-stone-300 p-1 text-center font-bold text-[10px]">{globalIndex}</td>
              <td className="border border-stone-300 px-2 py-1 font-bold text-black text-right text-[10px]">{m.name}</td>
              {sessionsToPrint.map(s => (
                  <td key={s.id} className="border border-stone-300 p-0 text-center font-bold text-[10px]">
                    {getStatus(s, m.id) === 'present' ? '✓' : getStatus(s, m.id) === 'absent' ? '✕' : getStatus(s, m.id) === 'excused' ? 'ع' : '-'}
                  </td>
              ))}
              <td className="border border-stone-300 p-1 text-center font-bold text-[10px]">{presentCount}</td>
              <td className="border border-stone-300 p-1 text-center font-bold bg-stone-100 text-[10px]">{percent}%</td>
            </tr>
          );
      });
  };

  // Determine Header Data (Date/Day)
  let headerDate = new Date(); // Default to today for summary
  let headerTitle = 'سجل الحضور العام 2026';

  if (printMode === 'single' && sessionsToPrint.length > 0) {
      headerDate = new Date(sessionsToPrint[0].date);
      const topic = sessionsToPrint[0].topic;
      headerTitle = topic ? `جلسة: ${topic}` : `سجل حضور جلسة ${headerDate.toLocaleDateString('ar-OM')}`;
  }

  return (
    <div className="space-y-4 pb-20 relative">
      {/* Top Header - Removed safe area padding here as it's handled by main Layout */}
      <div className="flex justify-between items-center px-4 sticky top-0 z-10 bg-stone-50 pb-3 border-b border-stone-100 shadow-sm pt-3">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <div className="flex space-x-2 space-x-reverse">
            <button 
                onClick={handlePrintSummary} 
                disabled={isProcessing}
                className="bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center shadow-sm active:scale-95 transition-transform"
            >
                {isProcessing && printMode === 'summary' ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Printer className="w-3 h-3 ml-1" />}
                التقرير العام
            </button>
        </div>
      </div>

      {/* قائمة الجلسات */}
      <div className="px-3 space-y-3">
        {sortedSessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 cursor-pointer" onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <span className="font-bold text-blue-700 flex items-center text-sm">
                            <Calendar className="w-4 h-4 ml-2" />
                            {new Date(session.date).toLocaleDateString('ar-OM')}
                        </span>
                        {session.topic && <span className="text-xs text-stone-400 truncate max-w-[100px] border-r border-stone-200 pr-2 mr-2">{session.topic}</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Single Print Button */}
                        <button 
                            onClick={(e) => handlePrintSingle(e, session.id)}
                            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="طباعة هذا اليوم فقط"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="text-stone-400 ml-1">
                            {expandedSession === session.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                </div>
                
                {expandedSession === session.id && (
                    <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                            const present = session.records.filter(r => r.status === 'present').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);
                            const absent = session.records.filter(r => r.status === 'absent').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);
                            const excused = session.records.filter(r => r.status === 'excused').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {present.length > 0 && (
                                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                            <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                الحاضرين ({present.length})
                                            </h4>
                                            <ul className="text-xs text-green-900 space-y-1.5 pr-2 border-r-2 border-green-200">
                                                {present.map((name, i) => <li key={i}>{name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {absent.length > 0 && (
                                        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                            <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                الغائبين ({absent.length})
                                            </h4>
                                            <ul className="text-xs text-red-900 space-y-1.5 pr-2 border-r-2 border-red-200">
                                                {absent.map((name, i) => <li key={i}>{name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {excused.length > 0 && (
                                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                المستأذنين ({excused.length})
                                            </h4>
                                            <ul className="text-xs text-amber-900 space-y-1.5 pr-2 border-r-2 border-amber-200">
                                                {excused.map((name, i) => <li key={i}>{name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* بوابة المعاينة والطباعة */}
      {showPreview && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          {/* شريط أدوات المعاينة - Safe Area is needed here because it's a Portal (full screen overlay) */}
          <div className="sticky top-0 p-4 pt-[env(safe-area-inset-top,20px)] flex justify-between items-center bg-blue-50 border-b border-blue-100 no-print z-50">
            <span className="text-sm font-bold text-blue-800">
                {printMode === 'summary' ? 'معاينة التقرير العام' : 'معاينة تقرير الجلسة'}
            </span>
            <div className="flex gap-2">
              <button onClick={handleSharePDF} className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold">مشاركة</button>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-white rounded-lg text-stone-500 border border-stone-200"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div id="print-content-inner" className="bg-white p-8 max-w-[210mm] mx-auto text-black min-h-screen">
            
            {/* الترويسة العليا المعدلة */}
            <div className="mb-6 border-b-2 border-black pb-4">
               {/* الصف العلوي: الشعار */}
               <div className="flex justify-center mb-2">
                    {settings.logoUrl && (
                        <div className="w-20 h-20 border border-stone-200 rounded-full overflow-hidden">
                            <img src={settings.logoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Logo" />
                        </div>
                    )}
               </div>

               {/* الصف الرئيسي: يوم - عنوان - تاريخ */}
               <div className="flex items-end justify-between w-full">
                    
                    {/* اليمين: اليوم */}
                    <div className="text-right w-1/4">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">اليوم</p>
                        <p className="text-lg font-black text-black">
                            {headerDate.toLocaleDateString('ar-OM', { weekday: 'long' })}
                        </p>
                    </div>

                    {/* الوسط: العنوان */}
                    <div className="text-center w-1/2 px-2">
                        <h1 className="text-2xl font-black text-black leading-none mb-1">عشيرة جوالة صحم</h1>
                        <p className="text-sm text-stone-600 font-bold mt-1">
                            {headerTitle}
                        </p>
                    </div>

                    {/* اليسار: التاريخ */}
                    <div className="text-left w-1/4">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">التاريخ</p>
                        <p className="text-lg font-black text-black dir-ltr">
                             {headerDate.toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                        </p>
                    </div>

               </div>
            </div>

            {/* الجدول والفوتر */}
            {printMode === 'summary' ? (
              <>
                <table className="w-full border-collapse border border-stone-300 text-[10px] table-fixed">
                  <thead>
                    <tr className="bg-stone-200 text-black">
                      <th className="border border-stone-300 p-1 w-8 text-center bg-stone-200">#</th>
                      <th className="border border-stone-300 p-1 text-right bg-stone-200">الاسم</th>
                      {sessionsToPrint.map(s => (
                        <th key={s.id} className="border border-stone-300 p-0 w-10 text-center align-bottom">
                               <div className="flex flex-col items-center justify-end pb-1 h-32">
                                   {/* Topic */}
                                   {s.topic && (
                                       <span className="text-[9px] font-bold rotate-[-90deg] whitespace-nowrap mb-2 origin-center text-blue-900 block w-4 truncate overflow-visible">
                                           {s.topic.substring(0, 15)}
                                       </span>
                                   )}
                                   
                                   {/* Day */}
                                   <span className="text-[9px] font-normal rotate-[-90deg] whitespace-nowrap mb-1 origin-center text-stone-600 block w-4">
                                       {new Date(s.date).toLocaleDateString('ar-OM', { weekday: 'short' })}
                                   </span>
                                   
                                   {/* Date */}
                                   <span className="text-[8px] font-bold border-t border-stone-400 pt-0.5 w-full block">
                                       {new Date(s.date).toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })}
                                   </span>
                               </div>
                        </th>
                      ))}
                      <th className="border border-stone-300 p-1 w-8 bg-stone-100">ح</th>
                      <th className="border border-stone-300 p-1 w-10 bg-stone-100">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Loop through Groups */}
                    {groups.map(group => {
                        const groupMembers = members.filter(m => m.groupId === group.id);
                        if (groupMembers.length === 0) return null;

                        return (
                            <React.Fragment key={group.id}>
                                <tr className="bg-stone-300 break-inside-avoid">
                                    <td colSpan={totalColumns} className="border border-stone-400 p-1 text-center font-bold text-stone-800 text-[11px]">
                                        {group.name}
                                    </td>
                                </tr>
                                {renderMemberRows(groupMembers)}
                            </React.Fragment>
                        );
                    })}

                    {/* 2. Unassigned Members */}
                    {unassignedMembers.length > 0 && (
                        <React.Fragment>
                             <tr className="bg-stone-300 break-inside-avoid">
                                <td colSpan={totalColumns} className="border border-stone-400 p-1 text-center font-bold text-stone-800 text-[11px]">
                                    غير منضمين لمجموعة
                                </td>
                            </tr>
                            {renderMemberRows(unassignedMembers)}
                        </React.Fragment>
                    )}
                  </tbody>
                </table>

                <div className="mt-4 flex items-center gap-4 text-[10px] text-stone-600 border-t border-stone-200 pt-2">
                  <div className="flex items-center"><span className="text-green-700 font-bold ml-1">✓</span> حاضر</div>
                  <div className="flex items-center"><span className="text-red-600 font-bold ml-1">✕</span> غائب</div>
                  <div className="flex items-center"><span className="text-amber-600 font-bold ml-1">ع</span> عذر</div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const session = sessionsToPrint[0];
                  if (!session) return null;
                  
                  const present = session.records.filter(r => r.status === 'present').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);
                  const absent = session.records.filter(r => r.status === 'absent').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);
                  const excused = session.records.filter(r => r.status === 'excused').map(r => members.find(m => m.id === r.memberId)?.name).filter(Boolean);

                  return (
                    <div className="grid grid-cols-3 gap-6">
                      {/* Present */}
                      <div className="border border-stone-300 rounded-lg overflow-hidden">
                        <div className="bg-stone-200 p-2 text-center font-bold text-black border-b border-stone-300">
                          الحاضرين ({present.length})
                        </div>
                        <ul className="p-4 space-y-2 text-sm">
                          {present.map((name, i) => <li key={i} className="border-b border-stone-100 pb-1">{i + 1}. {name}</li>)}
                        </ul>
                      </div>
                      
                      {/* Absent */}
                      <div className="border border-stone-300 rounded-lg overflow-hidden">
                        <div className="bg-stone-200 p-2 text-center font-bold text-black border-b border-stone-300">
                          الغائبين ({absent.length})
                        </div>
                        <ul className="p-4 space-y-2 text-sm">
                          {absent.map((name, i) => <li key={i} className="border-b border-stone-100 pb-1">{i + 1}. {name}</li>)}
                        </ul>
                      </div>

                      {/* Excused */}
                      <div className="border border-stone-300 rounded-lg overflow-hidden">
                        <div className="bg-stone-200 p-2 text-center font-bold text-black border-b border-stone-300">
                          المستأذنين ({excused.length})
                        </div>
                        <ul className="p-4 space-y-2 text-sm">
                          {excused.map((name, i) => <li key={i} className="border-b border-stone-100 pb-1">{i + 1}. {name}</li>)}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-10 mt-12 px-4 text-center break-inside-avoid">
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-stone-500 mb-2">منسق العشيرة وأمين السر</p>
                <p className="font-bold text-black text-sm border-b border-dotted border-stone-400 pb-1 w-full max-w-[150px]">{settings.coordinatorName || '................'}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-stone-500 mb-2">قائد العشيرة</p>
                <p className="font-bold text-black text-sm border-b border-dotted border-stone-400 pb-1 w-full max-w-[150px]">{settings.leaderName || '................'}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Archive;

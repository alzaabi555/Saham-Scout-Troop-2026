import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Trash2, Calendar, Printer, FileDown, Loader2, X } from 'lucide-react';
import { Member, MeetingSession, AppSettings } from '../types';

interface ArchiveProps {
  sessions: MeetingSession[];
  members: Member[];
  settings: AppSettings;
  onDeleteSession: (sessionId: string) => void;
}

const Archive: React.FC<ArchiveProps> = ({ sessions, members, settings, onDeleteSession }) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Handlers ---

  const handlePrintRequest = () => {
    setShowPreview(true);
    // Allow DOM to render the portal content
    setTimeout(() => {
        window.print();
    }, 500);
  };

  const handleDownloadPDF = () => {
    setShowPreview(true);
    setIsProcessing(true);

    setTimeout(() => {
        const element = document.getElementById('print-content-inner');
        if (!element) {
            alert("فشل العثور على محتوى الطباعة");
            setIsProcessing(false);
            return;
        }

        const opt = {
          margin: [5, 5, 5, 5],
          filename: `تقرير_جوالة_صحم_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
              scale: 2, 
              useCORS: true, 
              scrollY: 0,
              logging: false,
              windowWidth: 800 // Force width to avoid mobile layout issues in PDF
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        if (window.html2pdf) {
            // @ts-ignore
            window.html2pdf().set(opt).from(element).save().then(() => {
                setIsProcessing(false);
                // Note: We keep the preview open so the user can verify, or they can close it manually.
            }).catch((err: any) => {
                console.error(err);
                alert("حدث خطأ أثناء إنشاء ملف PDF. حاول مرة أخرى.");
                setIsProcessing(false);
            });
        } else {
            alert("مكتبة PDF لم يتم تحميلها بشكل صحيح. يرجى تحديث الصفحة.");
            setIsProcessing(false);
        }
    }, 1000); 
  };

  const toggleExpand = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('هل تريد حذف هذا السجل نهائياً؟')) {
      onDeleteSession(id);
    }
  };

  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Fit to page logic
  const printSessions = sortedSessions.slice(0, 10);

  // --- Render Functions ---

  return (
    <div className="space-y-4 pb-20 relative">
      {/* Header */}
      <div className="flex justify-between items-center px-1 sticky top-0 z-10 bg-stone-50 py-2">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <div className="flex space-x-2 space-x-reverse">
            <button 
                onClick={handlePrintRequest}
                className="flex items-center bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm active:bg-stone-300 transition-colors"
                title="طباعة"
            >
                <Printer className="w-4 h-4" />
            </button>
            <button 
                onClick={handleDownloadPDF}
                disabled={isProcessing}
                className="flex items-center bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:bg-blue-900 transition-colors disabled:opacity-70"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
                حفظ PDF
            </button>
        </div>
      </div>

      {/* List Content */}
      {sortedSessions.length === 0 ? (
         <div className="text-center py-12 text-stone-400">
           لا توجد سجلات محفوظة.
         </div>
      ) : (
        <div className="space-y-3">
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

              {expandedSession === session.id && (
                <div className="bg-stone-50 p-4 border-t border-stone-100 animate-fade-in">
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
          PORTAL PRINT PREVIEW 
          Renders directly into <body> to bypass app layout
          =============================================
      */}
      {showPreview && createPortal(
          <div 
            className="fixed inset-0 z-[99999] bg-white overflow-y-auto print-portal-container animate-fade-in"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
              {/* Toolbar (Hidden in Print) */}
              <div className="sticky top-0 right-0 p-4 flex justify-between items-center bg-blue-50 border-b border-blue-100 no-print mb-4 shadow-sm z-50">
                  <div className="text-sm font-bold text-blue-800 flex items-center">
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      {isProcessing ? 'جاري إنشاء PDF...' : 'معاينة التقرير'}
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => window.print()}
                        className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm"
                      >
                          طباعة
                      </button>
                      <button 
                        onClick={() => setShowPreview(false)}
                        className="p-2 bg-white rounded-lg text-stone-500 hover:text-red-500 shadow-sm border border-stone-200"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              {/* Printable Area */}
              <div id="print-content-inner" className="bg-white p-4 max-w-[210mm] mx-auto min-h-screen text-black">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                    <div className="text-right">
                        <h2 className="text-[12px] font-bold text-stone-600 mb-1">سلطنة عمان</h2>
                        <h1 className="text-xl font-black text-black leading-tight mb-1">{settings.troopName}</h1>
                        <p className="text-[10px] text-stone-600">سجل الحضور لعام 2026</p>
                    </div>
                    
                    {settings.logoUrl ? (
                        <div className="w-20 h-20 border border-stone-200 rounded-full overflow-hidden mx-4">
                            <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        </div>
                    ) : <div className="w-10"></div>}

                    <div className="text-left">
                        <div className="text-[10px] font-bold text-stone-500">القائد المسؤول</div>
                        <div className="text-[14px] font-bold text-black">{settings.leaderName}</div>
                        <div className="text-[10px] text-stone-500 mt-1">{new Date().toLocaleDateString('ar-OM')}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full">
                    <table className="w-full border-collapse border border-stone-300 text-[10px] table-fixed">
                        <thead>
                        <tr className="bg-stone-100 text-black">
                            <th className="border border-stone-300 p-1 w-8 text-center bg-stone-200 font-bold">#</th>
                            <th className="border border-stone-300 p-1 text-right bg-stone-200 font-bold">الاسم</th>
                            
                            {printSessions.map(s => (
                                <th key={s.id} className="border border-stone-300 p-0 text-center align-middle w-8 h-12">
                                    <div className="flex flex-col items-center justify-center h-full w-full">
                                        <span className="text-[9px] font-bold text-stone-600 leading-none block -rotate-90 transform origin-center w-8">
                                            {new Date(s.date).toLocaleDateString('ar-OM', { weekday: 'short' })}
                                        </span>
                                        <span className="text-[8px] font-bold text-black border-t border-stone-300 pt-0.5 mt-0.5 w-full block">
                                            {new Date(s.date).toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            
                            <th className="border border-stone-300 p-1 w-8 bg-stone-100 text-[9px] font-bold">ح</th>
                            <th className="border border-stone-300 p-1 w-9 bg-stone-100 text-[9px] font-bold">%</th>
                        </tr>
                        </thead>
                        <tbody>
                        {members.map((member, idx) => {
                            const memberSessions = printSessions;
                            const presentCount = memberSessions.filter(s => getStatus(s, member.id) === 'present').length;
                            const percent = memberSessions.length > 0 ? Math.round((presentCount / memberSessions.length) * 100) : 0;
                            
                            return (
                            <tr key={member.id} className="break-inside-avoid odd:bg-white even:bg-stone-50" style={{ height: '24px' }}>
                                <td className="border border-stone-300 p-0 text-center font-bold text-stone-500">{idx + 1}</td>
                                <td className="border border-stone-300 px-2 py-0 font-bold text-black whitespace-nowrap overflow-hidden text-ellipsis text-right">{member.name}</td>
                                
                                {memberSessions.map(session => {
                                    const st = getStatus(session, member.id);
                                    let content = null;
                                    let cellClass = "";
                                    
                                    if (st === 'present') {
                                        content = <span className="text-green-700 font-bold text-[12px]">✓</span>;
                                        cellClass = "bg-green-50/50";
                                    } else if (st === 'absent') {
                                        content = <span className="text-red-600 font-bold text-[10px]">✕</span>;
                                        cellClass = "bg-red-50/50";
                                    } else if (st === 'excused') {
                                        content = <span className="text-amber-600 font-bold text-[10px]">ع</span>;
                                        cellClass = "bg-amber-50/50";
                                    }
                                    
                                    return (
                                        <td key={session.id} className={`border border-stone-300 p-0 text-center align-middle ${cellClass}`}>
                                            {content}
                                        </td>
                                    );
                                })}
                                <td className="border border-stone-300 p-0 text-center font-bold">{presentCount}</td>
                                <td className="border border-stone-300 p-0 text-center font-bold bg-stone-100">{percent}%</td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Legend */}
                <div className="mt-4 flex items-center justify-between text-[10px] text-stone-600 border-t-2 border-stone-300 pt-2 break-inside-avoid">
                    <div className="flex gap-4">
                        <div className="flex items-center"><span className="text-green-700 font-bold mx-1">✓</span> حاضر</div>
                        <div className="flex items-center"><span className="text-red-600 font-bold mx-1">✕</span> غائب</div>
                        <div className="flex items-center"><span className="text-amber-600 font-bold mx-1">ع</span> عذر</div>
                    </div>
                </div>
                
                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 mt-12 px-2 text-center break-inside-avoid">
                    <div>
                        <p className="text-[10px] text-stone-500 mb-2">منسق العشيرة وامين السر </p>
                        <p className="font-bold text-black text-sm">{settings.coordinatorName}</p>
                        <div className="mt-4 border-b border-dotted border-stone-400 w-2/3 mx-auto"></div>
                    </div>
                    <div>
                        <p className="text-[10px] text-stone-500 mb-2">القائد</p>
                        <p className="font-bold text-black text-sm">{settings.leaderName}</p>
                        <div className="mt-4 border-b border-dotted border-stone-400 w-2/3 mx-auto"></div>
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
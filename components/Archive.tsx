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

  // --- الحسابات والمنطق ---
  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const printSessions = sortedSessions.slice(0, 10); // تحديد آخر 10 جلسات للتقرير

  // --- معالج الطباعة والحفظ (إصلاح آيفون) ---
  const handleSharePDF = async () => {
    setIsProcessing(true);
    setShowPreview(true);

    setTimeout(async () => {
      const element = document.getElementById('print-content-inner');
      if (!element || !(window as any).html2pdf) {
        alert("يرجى الانتظار، جاري تحميل محرك الـ PDF...");
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

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'تقرير حضور جوالة صحم' });
        } else {
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء إنشاء التقرير.");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-4 pb-20 relative">
      {/* الرأس (Header) */}
      <div className="flex justify-between items-center px-1 sticky top-0 z-10 bg-stone-50 py-2">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <div className="flex space-x-2 space-x-reverse">
            <button onClick={handleSharePDF} className="flex items-center bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm active:bg-stone-300 transition-colors">
                <Printer className="w-4 h-4" />
            </button>
            <button onClick={handleSharePDF} disabled={isProcessing} className="flex items-center bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:bg-blue-900 transition-colors disabled:opacity-70">
                {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
                حفظ PDF
            </button>
        </div>
      </div>

      {/* قائمة الجلسات الرئيسية */}
      <div className="space-y-3">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12 text-stone-400">لا توجد سجلات محفوظة.</div>
        ) : (
          sortedSessions.map(session => {
            const presentCount = session.records.filter(r => r.status === 'present').length;
            return (
              <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-4 active:bg-stone-50 transition-colors" onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center text-blue-700 font-bold mb-1">
                        <Calendar className="w-4 h-4 ml-2" />
                        {new Date(session.date).toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      {session.topic && <p className="text-sm text-stone-500 pr-6">{session.topic}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm('حذف نهائي؟')) onDeleteSession(session.id); }} className="p-2 text-stone-300 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-50">
                    <div className="flex space-x-2 space-x-reverse">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">{presentCount} حاضر</span>
                      <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-md">{members.length} إجمالي</span>
                    </div>
                    {expandedSession === session.id ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                  </div>
                </div>

                {/* تفاصيل الجلسة عند التوسيع */}
                {expandedSession === session.id && (
                  <div className="bg-stone-50 p-4 border-t border-stone-100 animate-fade-in">
                    <div className="space-y-2">
                      {members.map(member => {
                        const status = getStatus(session, member.id);
                        let icon = <span className="w-2 h-2 rounded-full bg-stone-300"></span>;
                        let textColor = "text-stone-500";
                        if (status === 'present') { icon = <span className="text-green-600 font-bold">✓</span>; textColor = "text-green-700"; }
                        if (status === 'absent') { icon = <span className="text-red-500 font-bold">✕</span>; textColor = "text-red-700"; }
                        if (status === 'excused') { icon = <span className="text-amber-500 font-bold">!</span>; textColor = "text-amber-700"; }
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
            );
          })
        )}
      </div>

      {/* بوابة المعاينة والطباعة (Portal) */}
      {showPreview && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto print-portal-container animate-fade-in">
          <div className="sticky top-0 p-4 flex justify-between items-center bg-blue-50 border-b border-blue-100 no-print z-50 shadow-sm">
            <span className="text-sm font-bold text-blue-800">معاينة التقرير</span>
            <div className="flex gap-2">
              <button onClick={handleSharePDF} className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">مشاركة / طباعة</button>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-white rounded-lg text-stone-500 border border-stone-200 shadow-sm"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div id="print-content-inner" className="bg-white p-8 max-w-[210mm] mx-auto text-black min-h-screen">
            {/* رأس التقرير (Header) */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <div className="text-right">
                <h2 className="text-[12px] font-bold text-stone-600 mb-1">سلطنة عمان</h2>
                <h1 className="text-xl font-black text-black leading-tight mb-1">{settings.troopName}</h1>
                <p className="text-[10px] text-stone-600">سجل الحضور لعام 2026</p>
              </div>
              {settings.logoUrl && (
                <div className="w-20 h-20 border border-stone-200 rounded-full overflow-hidden mx-4">
                  <img src={settings.logoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Logo" />
                </div>
              )}
              <div className="text-left">
                <div className="text-[10px] font-bold text-stone-500">القائد المسؤول</div>
                <div className="text-[14px] font-bold text-black">{settings.leaderName}</div>
                <div className="text-[10px] text-stone-500 mt-1">{new Date().toLocaleDateString('ar-OM')}</div>
              </div>
            </div>

            {/* جدول التقرير (Table) */}
            <table className="w-full border-collapse border border-stone-300 text-[10px] table-fixed">
              <thead>
                <tr className="bg-stone-200 text-black">
                  <th className="border border-stone-300 p-1 w-8 font-bold">#</th>
                  <th className="border border-stone-300 p-1 text-right font-bold">الاسم</th>
                  {printSessions.map(s => (
                    <th key={s.id} className="border border-stone-300 p-1 w-10 text-center font-bold">
                      {new Date(s.date).toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })}
                    </th>
                  ))}
                  <th className="border border-stone-300 p-1 w-8 bg-stone-100 font-bold">ح</th>
                  <th className="border border-stone-300 p-1 w-10 bg-stone-100 font-bold">%</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const presentCount = printSessions.filter(s => getStatus(s, m.id) === 'present').length;
                  const percent = printSessions.length > 0 ? Math.round((presentCount / printSessions.length) * 100) : 0;
                  return (
                    <tr key={m.id} className="odd:bg-white even:bg-stone-50" style={{ height: '24px' }}>
                      <td className="border border-stone-300 p-1 text-center font-bold text-stone-500">{i + 1}</td>
                      <td className="border border-stone-300 px-2 py-1 font-bold text-black text-right whitespace-nowrap overflow-hidden text-ellipsis">{m.name}</td>
                      {printSessions.map(s => {
                        const st = getStatus(s, m.id);
                        let content = null;
                        if (st === 'present') content = <span className="text-green-700 font-bold text-[12px]">✓</span>;
                        else if (st === 'absent') content = <span className="text-red-600 font-bold">✕</span>;
                        else if (st === 'excused') content = <span className="text-amber-600 font-bold">ع</span>;
                        return <td key={s.id} className="border border-stone-300 p-0 text-center align-middle">{content}</td>;
                      })}
                      <td className="border border-stone-300 p-1 text-center font-bold">{presentCount}</td>
                      <td className="border border-stone-300 p-1 text-center font-bold bg-stone-100">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* الفوتر (Legend & Signatures) */}
            <div className="mt-4 flex items-center gap-4 text-[10px] text-stone-600 border-t border-stone-200 pt-2 break-inside-avoid">
              <div className="flex items-center"><span className="text-green-700 font-bold ml-1">✓</span> حاضر</div>
              <div className="flex items-center"><span className="text-red-600 font-bold ml-1">✕</span> غائب</div>
              <div className="flex items-center"><span className="text-amber-600 font-bold ml-1">ع</span> عذر</div>
            </div>

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

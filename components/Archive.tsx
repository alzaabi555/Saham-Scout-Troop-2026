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

  // --- المنطق ---
  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const printSessions = sortedSessions.slice(0, 10);

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

  return (
    <div className="space-y-4 pb-20 relative">
      {/* 
          تعديل مسافة الأمان هنا للهيدر الرئيسي 
          إضافة pt-[env(safe-area-inset-top)] لدفعه أسفل النتوش 
      */}
      <div className="flex justify-between items-center px-4 sticky top-0 z-10 bg-stone-50 pt-[env(safe-area-inset-top)] pb-3 border-b border-stone-100 shadow-sm">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <div className="flex space-x-2 space-x-reverse">
            <button onClick={handleSharePDF} className="p-2 bg-stone-200 text-stone-700 rounded-xl"><Printer className="w-5 h-5" /></button>
            <button onClick={handleSharePDF} disabled={isProcessing} className="bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center">
                {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
                حفظ PDF
            </button>
        </div>
      </div>

      {/* قائمة الجلسات */}
      <div className="px-3 space-y-3">
        {sortedSessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4" onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-700 flex items-center"><Calendar className="w-4 h-4 ml-2" />{new Date(session.date).toLocaleDateString('ar-OM')}</span>
                    <Trash2 className="w-5 h-5 text-stone-300" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} />
                </div>
            </div>
        ))}
      </div>

      {/* بوابة المعاينة والطباعة */}
      {showPreview && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          {/* 
              تعديل مسافة الأمان لشريط أدوات المعاينة 
          */}
          <div className="sticky top-0 p-4 pt-[env(safe-area-inset-top)] flex justify-between items-center bg-blue-50 border-b border-blue-100 no-print z-50">
            <span className="text-sm font-bold text-blue-800">معاينة التقرير</span>
            <div className="flex gap-2">
              <button onClick={handleSharePDF} className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold">مشاركة</button>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-white rounded-lg text-stone-500 border border-stone-200"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div id="print-content-inner" className="bg-white p-8 max-w-[210mm] mx-auto text-black min-h-screen">
            {/* الترويسة العليا (حسب طلبك: تاريخ يمين، شعار واسم في المنتصف) */}
            <div className="relative mb-6 border-b-2 border-black pb-4">
              <div className="absolute top-0 right-0 text-right text-[10px] text-stone-600 font-bold">
                  <div className="text-black mb-0.5">{new Date().toLocaleDateString('ar-OM', { weekday: 'long' })}</div>
                  <div>{new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>

              <div className="flex flex-col items-center justify-center">
                {settings.logoUrl && (
                  <div className="w-24 h-24 border border-stone-200 rounded-full overflow-hidden mb-3">
                    <img src={settings.logoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Logo" />
                  </div>
                )}
                <h1 className="text-2xl font-black text-black leading-tight">عشيرة جوالة صحم</h1>
                <p className="text-sm text-stone-600 mt-1 font-bold">سجل الحضور لعام 2026 م</p>
              </div>
            </div>

            {/* الجدول والفوتر (بدون تغيير) */}
            <table className="w-full border-collapse border border-stone-300 text-[10px] table-fixed">
              <thead>
                <tr className="bg-stone-200 text-black">
                  <th className="border border-stone-300 p-1 w-8">#</th>
                  <th className="border border-stone-300 p-1 text-right">الاسم</th>
                  {printSessions.map(s => (
                    <th key={s.id} className="border border-stone-300 p-1 w-10 text-center font-bold">
                      {new Date(s.date).toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })}
                    </th>
                  ))}
                  <th className="border border-stone-300 p-1 w-8 bg-stone-100">ح</th>
                  <th className="border border-stone-300 p-1 w-10 bg-stone-100">%</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const presentCount = printSessions.filter(s => getStatus(s, m.id) === 'present').length;
                  const percent = printSessions.length > 0 ? Math.round((presentCount / printSessions.length) * 100) : 0;
                  return (
                    <tr key={m.id} className="odd:bg-white even:bg-stone-50" style={{ height: '24px' }}>
                      <td className="border border-stone-300 p-1 text-center font-bold">{i + 1}</td>
                      <td className="border border-stone-300 px-2 py-1 font-bold text-black text-right">{m.name}</td>
                      {printSessions.map(s => (
                         <td key={s.id} className="border border-stone-300 p-0 text-center font-bold">
                            {getStatus(s, m.id) === 'present' ? '✓' : getStatus(s, m.id) === 'absent' ? '✕' : getStatus(s, m.id) === 'excused' ? 'ع' : '-'}
                         </td>
                      ))}
                      <td className="border border-stone-300 p-1 text-center font-bold">{presentCount}</td>
                      <td className="border border-stone-300 p-1 text-center font-bold bg-stone-100">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 flex items-center gap-4 text-[10px] text-stone-600 border-t border-stone-200 pt-2">
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

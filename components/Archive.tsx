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

  const handleSharePDF = async () => {
    setIsProcessing(true);
    setShowPreview(true);

    // نمهل النظام وقتاً لرسم الـ Portal
    setTimeout(async () => {
      const element = document.getElementById('print-content-inner');
      if (!element || !(window as any).html2pdf) {
        alert("يرجى الانتظار، جاري تحميل محرك الـ PDF...");
        setIsProcessing(false);
        return;
      }

      const opt = {
        margin: [10, 5, 10, 5],
        filename: `تقرير_الجوالة_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, // حل مشكلة الشعار
          logging: false 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        // توليد الملف كـ Blob لدعم قائمة المشاركة في iOS
        const pdfBlob = await (window as any).html2pdf().set(opt).from(element).output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'تقرير حضور جوالة صحم',
          });
        } else {
          // حل احتياطي للمتصفحات التي لا تدعم المشاركة
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error(err);
        alert("فشل إنشاء الملف. تأكد من جودة اتصال الإنترنت.");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const getStatus = (session: MeetingSession, memberId: string) => {
    const record = session.records.find(r => r.memberId === memberId);
    return record ? record.status : '-';
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const printSessions = sortedSessions.slice(0, 10);

  return (
    <div className="space-y-4 pb-20 relative">
      <div className="flex justify-between items-center px-1 sticky top-0 z-10 bg-stone-50 py-2">
        <h2 className="text-xl font-bold text-stone-800">سجل الجلسات</h2>
        <div className="flex space-x-2 space-x-reverse">
            <button 
                onClick={handleSharePDF}
                className="flex items-center bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold"
            >
                <Printer className="w-4 h-4" />
            </button>
            <button 
                onClick={handleSharePDF}
                disabled={isProcessing}
                className="flex items-center bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-70"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
                حفظ PDF
            </button>
        </div>
      </div>

      {/* عرض السجلات (نفس الكود السابق) */}
      <div className="space-y-3">
        {sortedSessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4" onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-700">{new Date(session.date).toLocaleDateString('ar-OM')}</span>
                    <Trash2 className="w-5 h-5 text-stone-300" onClick={(e) => {e.stopPropagation(); onDeleteSession(session.id);}} />
                </div>
            </div>
        ))}
      </div>

      {showPreview && createPortal(
          <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto print-portal-container">
              <div className="sticky top-0 p-4 flex justify-between items-center bg-blue-50 no-print z-50">
                  <span className="text-sm font-bold text-blue-800">معاينة التقرير</span>
                  <div className="flex gap-2">
                      <button onClick={handleSharePDF} className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold">مشاركة / طباعة</button>
                      <button onClick={() => setShowPreview(false)} className="p-2 bg-white rounded-lg text-stone-500 border border-stone-200"><X className="w-5 h-5" /></button>
                  </div>
              </div>

              <div id="print-content-inner" className="bg-white p-6 max-w-[210mm] mx-auto text-black">
                <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                    <div className="text-right">
                        <h2 className="text-[12px] font-bold text-stone-600">سلطنة عمان</h2>
                        <h1 className="text-xl font-black">{settings.troopName}</h1>
                    </div>
                    {settings.logoUrl && (
                        <div className="w-20 h-20 rounded-full overflow-hidden border">
                            <img 
                                src={settings.logoUrl} 
                                crossOrigin="anonymous" // حل مشكلة الشعار في iOS
                                className="w-full h-full object-cover" 
                                alt="Logo" 
                            />
                        </div>
                    )}
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-stone-500">القائد</div>
                        <div className="text-[14px] font-bold">{settings.leaderName}</div>
                    </div>
                </div>

                <table className="w-full border-collapse border border-stone-300 text-[10px]">
                    <thead>
                        <tr className="bg-stone-200">
                            <th className="border border-stone-300 p-1">#</th>
                            <th className="border border-stone-300 p-1 text-right">الاسم</th>
                            {printSessions.map(s => (
                                <th key={s.id} className="border border-stone-300 p-1">{new Date(s.date).toLocaleDateString('ar-OM', {day:'numeric', month:'numeric'})}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m, i) => (
                            <tr key={m.id} className="odd:bg-white even:bg-stone-50">
                                <td className="border border-stone-300 p-1 text-center">{i+1}</td>
                                <td className="border border-stone-300 p-1 text-right font-bold">{m.name}</td>
                                {printSessions.map(s => (
                                    <td key={s.id} className="border border-stone-300 p-1 text-center">
                                        {getStatus(s, m.id) === 'present' ? '✓' : getStatus(s, m.id) === 'absent' ? '✕' : 'ع'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default Archive;

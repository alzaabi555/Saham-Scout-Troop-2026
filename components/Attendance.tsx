import React, { useState, useEffect } from 'react';
import { Save, Calendar, Check, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Member, MeetingSession, AttendanceRecord, AttendanceStatus } from '../types';
import { generateId } from '../utils/storage';

interface AttendanceProps {
  members: Member[];
  onSaveSession: (session: MeetingSession) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ members, onSaveSession }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [step, setStep] = useState<'details' | 'list'>('details');

  // Initialize
  useEffect(() => {
    setAttendance(prev => {
        const next = { ...prev };
        members.forEach(m => {
            if (!next[m.id]) next[m.id] = 'present'; 
        });
        return next;
    });
  }, [members]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [memberId]: status }));
  };

  const handleSave = () => {
    const records: AttendanceRecord[] = Object.entries(attendance).map(([memberId, status]) => ({
      memberId,
      status: status as AttendanceStatus
    }));

    onSaveSession({
      id: generateId(),
      date,
      topic,
      records
    });
    
    // Reset
    setStep('details');
    setTopic('');
    alert('تم حفظ الحضور بنجاح');
  };

  if (members.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold text-stone-800">لا يوجد أعضاء</h3>
              <p className="text-stone-500 mt-2">يرجى إضافة الأعضاء أولاً من القائمة.</p>
          </div>
      )
  }

  // Step 1: Session Details
  if (step === 'details') {
      return (
          <div className="space-y-6">
              <h2 className="text-xl font-bold text-stone-800">بيانات الجلسة</h2>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">التاريخ</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-4 bg-stone-50 border-none rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">الموضوع (اختياري)</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="عنوان النشاط..."
                        className="w-full p-4 bg-stone-50 border-none rounded-xl text-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
              </div>

              <button 
                onClick={() => setStep('list')}
                className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
              >
                  بدء التحضير
              </button>
          </div>
      )
  }

  // Step 2: Taking Attendance
  const stats = {
      present: Object.values(attendance).filter(s => s === 'present').length,
      absent: Object.values(attendance).filter(s => s === 'absent').length,
      excused: Object.values(attendance).filter(s => s === 'excused').length,
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-stone-50 pt-2 pb-4 z-10 border-b border-stone-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-stone-800">القائمة</h2>
            <button onClick={() => setStep('details')} className="text-sm text-stone-500 underline">تعديل البيانات</button>
        </div>
        <div className="flex space-x-2 space-x-reverse">
            <div className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg text-center font-bold text-sm">
                {stats.present} حاضر
            </div>
            <div className="flex-1 bg-red-100 text-red-800 py-2 rounded-lg text-center font-bold text-sm">
                {stats.absent} غائب
            </div>
            <div className="flex-1 bg-amber-100 text-amber-800 py-2 rounded-lg text-center font-bold text-sm">
                {stats.excused} عذر
            </div>
        </div>
      </div>

      <div className="space-y-3">
          {members.map(member => (
              <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                  <p className="font-bold text-stone-800 text-lg mb-3">{member.name}</p>
                  
                  {/* Big Toggle Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleStatusChange(member.id, 'present')}
                        className={`
                            py-3 rounded-xl flex flex-col items-center justify-center transition-all
                            ${attendance[member.id] === 'present' 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                        `}
                      >
                          <Check className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">حاضر</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(member.id, 'absent')}
                        className={`
                            py-3 rounded-xl flex flex-col items-center justify-center transition-all
                            ${attendance[member.id] === 'absent' 
                                ? 'bg-red-500 text-white shadow-md' 
                                : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                        `}
                      >
                          <X className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">غائب</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(member.id, 'excused')}
                        className={`
                            py-3 rounded-xl flex flex-col items-center justify-center transition-all
                            ${attendance[member.id] === 'excused' 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                        `}
                      >
                          <AlertTriangle className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">عذر</span>
                      </button>
                  </div>
              </div>
          ))}
      </div>

      <div className="fixed bottom-20 left-4 right-4 z-20">
          <button
            onClick={handleSave}
            className="w-full bg-blue-800 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center"
          >
              <Save className="w-5 h-5 ml-2" />
              حفظ السجل النهائي
          </button>
      </div>
    </div>
  );
};

export default Attendance;
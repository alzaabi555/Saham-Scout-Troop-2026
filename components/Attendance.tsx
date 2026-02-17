import React, { useState, useEffect } from 'react';
import { Save, Calendar, Check, X, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Member, MeetingSession, AttendanceRecord, AttendanceStatus, Group } from '../types';
import { generateId } from '../utils/storage';

interface AttendanceProps {
  members: Member[];
  groups: Group[];
  onSaveSession: (session: MeetingSession) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ members, groups, onSaveSession }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [step, setStep] = useState<'details' | 'list'>('details');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Initialize attendance with 'present' for all
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

  const toggleGroupCollapse = (groupId: string) => {
      setCollapsedGroups(prev => ({...prev, [groupId]: !prev[groupId]}));
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

  // Organize Data for View
  const stats = {
      present: Object.values(attendance).filter(s => s === 'present').length,
      absent: Object.values(attendance).filter(s => s === 'absent').length,
      excused: Object.values(attendance).filter(s => s === 'excused').length,
  };

  const unassignedMembers = members.filter(m => !m.groupId);

  return (
    <div className="flex flex-col h-full bg-stone-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-stone-50 z-20 border-b border-stone-200 shadow-sm pb-2">
        <div className="flex justify-between items-center mb-2 px-2 pt-2">
            <div>
                <h2 className="text-lg font-bold text-stone-800">قائمة التحضير</h2>
                <p className="text-xs text-stone-500">{new Date(date).toLocaleDateString('ar-OM')}</p>
            </div>
            <button onClick={() => setStep('details')} className="text-xs bg-stone-200 px-3 py-1 rounded-full font-bold text-stone-600">
                تعديل البيانات
            </button>
        </div>
        
        {/* Compact Stats Bar */}
        <div className="grid grid-cols-3 gap-2 px-2">
            <div className="bg-green-100 border border-green-200 text-green-800 py-1.5 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> {stats.present}
            </div>
            <div className="bg-red-100 border border-red-200 text-red-800 py-1.5 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1">
                <X className="w-3 h-3" /> {stats.absent}
            </div>
            <div className="bg-amber-100 border border-amber-200 text-amber-800 py-1.5 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {stats.excused}
            </div>
        </div>
      </div>

      {/* Sheet-like List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          
          {/* GROUPS */}
          {groups.map(group => {
              const groupMembers = members.filter(m => m.groupId === group.id);
              if (groupMembers.length === 0) return null;
              
              const isCollapsed = collapsedGroups[group.id];

              return (
                  <div key={group.id} className="bg-white rounded-lg shadow-sm border border-stone-300 overflow-hidden">
                      {/* Group Header */}
                      <div 
                        className="bg-blue-50 px-3 py-2 border-b border-stone-200 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleGroupCollapse(group.id)}
                      >
                          <h3 className="font-bold text-blue-900 text-sm">{group.name}</h3>
                          <div className="flex items-center gap-2">
                              <span className="bg-white text-blue-800 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 font-bold">
                                  {groupMembers.length}
                              </span>
                              {isCollapsed ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronUp className="w-4 h-4 text-blue-400" />}
                          </div>
                      </div>

                      {/* Members Table */}
                      {!isCollapsed && (
                        <div className="divide-y divide-stone-200">
                            {/* Table Header */}
                            <div className="flex bg-stone-100 text-[10px] font-bold text-stone-500 py-1">
                                <div className="flex-1 px-3 text-right">الاسم</div>
                                <div className="w-12 text-center">حاضر</div>
                                <div className="w-12 text-center">غائب</div>
                                <div className="w-12 text-center">عذر</div>
                            </div>
                            
                            {/* Rows */}
                            {groupMembers.map(member => (
                                <div key={member.id} className="flex items-center py-0.5 text-sm hover:bg-stone-50">
                                    <div className="flex-1 px-3 py-2 font-medium text-stone-800 text-xs truncate">
                                        {member.name}
                                    </div>
                                    
                                    {/* Present Button */}
                                    <div 
                                        onClick={() => handleStatusChange(member.id, 'present')}
                                        className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                            ${attendance[member.id] === 'present' ? 'bg-green-600 text-white' : 'text-stone-300 hover:bg-green-50'}`}
                                    >
                                        <Check className="w-5 h-5" />
                                    </div>

                                    {/* Absent Button */}
                                    <div 
                                        onClick={() => handleStatusChange(member.id, 'absent')}
                                        className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                            ${attendance[member.id] === 'absent' ? 'bg-red-500 text-white' : 'text-stone-300 hover:bg-red-50'}`}
                                    >
                                        <X className="w-5 h-5" />
                                    </div>

                                    {/* Excused Button */}
                                    <div 
                                        onClick={() => handleStatusChange(member.id, 'excused')}
                                        className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                            ${attendance[member.id] === 'excused' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:bg-amber-50'}`}
                                    >
                                        <div className="font-bold text-xs">ع</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      )}
                  </div>
              );
          })}

          {/* UNASSIGNED MEMBERS */}
          {unassignedMembers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-stone-300 overflow-hidden">
                  <div className="bg-stone-200 px-3 py-2 border-b border-stone-300">
                      <h3 className="font-bold text-stone-700 text-sm">غير منضمين لمجموعات</h3>
                  </div>
                  <div className="divide-y divide-stone-200">
                        <div className="flex bg-stone-100 text-[10px] font-bold text-stone-500 py-1">
                                <div className="flex-1 px-3 text-right">الاسم</div>
                                <div className="w-12 text-center">حاضر</div>
                                <div className="w-12 text-center">غائب</div>
                                <div className="w-12 text-center">عذر</div>
                        </div>
                      {unassignedMembers.map(member => (
                        <div key={member.id} className="flex items-center py-0.5 text-sm hover:bg-stone-50">
                            <div className="flex-1 px-3 py-2 font-medium text-stone-800 text-xs truncate">
                                {member.name}
                            </div>
                            
                            <div 
                                onClick={() => handleStatusChange(member.id, 'present')}
                                className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                    ${attendance[member.id] === 'present' ? 'bg-green-600 text-white' : 'text-stone-300 hover:bg-green-50'}`}
                            >
                                <Check className="w-5 h-5" />
                            </div>

                            <div 
                                onClick={() => handleStatusChange(member.id, 'absent')}
                                className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                    ${attendance[member.id] === 'absent' ? 'bg-red-500 text-white' : 'text-stone-300 hover:bg-red-50'}`}
                            >
                                <X className="w-5 h-5" />
                            </div>

                            <div 
                                onClick={() => handleStatusChange(member.id, 'excused')}
                                className={`w-12 h-10 flex items-center justify-center cursor-pointer border-l border-stone-100 transition-colors
                                    ${attendance[member.id] === 'excused' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:bg-amber-50'}`}
                            >
                                <div className="font-bold text-xs">ع</div>
                            </div>
                        </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      <div className="fixed bottom-20 left-4 right-4 z-30">
          <button
            onClick={handleSave}
            className="w-full bg-blue-800 text-white py-3 rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 flex items-center justify-center active:scale-95 transition-transform border border-blue-900"
          >
              <Save className="w-5 h-5 ml-2" />
              حفظ السجل
          </button>
      </div>
    </div>
  );
};

export default Attendance;
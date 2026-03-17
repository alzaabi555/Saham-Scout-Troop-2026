import React, { useState, useEffect } from 'react';
import { Save, Calendar, Check, X, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ArrowRight, Plus, UserPlus } from 'lucide-react';
import { Member, MeetingSession, AttendanceRecord, AttendanceStatus, Group } from '../types';
import { generateId } from '../utils/storage';

interface AttendanceProps {
  members: Member[];
  groups: Group[];
  onSaveSession: (session: MeetingSession) => void;
  initialSession?: MeetingSession | null;
  onCancelEdit?: () => void;
  onUpdateMembers?: (members: Member[]) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ members, groups, onSaveSession, initialSession, onCancelEdit, onUpdateMembers }) => {
  const [date, setDate] = useState(initialSession ? initialSession.date : new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState(initialSession ? initialSession.topic : '');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [step, setStep] = useState<'details' | 'list'>('details');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGroupExpanded, setIsGroupExpanded] = useState<Record<string, boolean>>({});

  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGroupId, setNewMemberGroupId] = useState<string>('');

  // Initialize selectedMembers
  useEffect(() => {
    if (initialSession) {
        setSelectedMembers(initialSession.records.map(r => r.memberId));
    } else {
        setSelectedMembers(members.map(m => m.id));
    }
  }, [members, initialSession]);

  // Initialize attendance
  useEffect(() => {
    setAttendance(prev => {
        const next = { ...prev };
        
        if (initialSession) {
            initialSession.records.forEach(r => {
                next[r.memberId] = r.status;
            });
        }

        members.forEach(m => {
            if (selectedMembers.includes(m.id)) {
                if (!next[m.id]) next[m.id] = 'present'; 
            } else {
                delete next[m.id];
            }
        });
        return next;
    });
  }, [members, selectedMembers, initialSession]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [memberId]: status }));
  };

  const toggleGroupCollapse = (groupId: string) => {
      setCollapsedGroups(prev => ({...prev, [groupId]: !prev[groupId]}));
  };

  const toggleGroupSelectionExpand = (groupId: string) => {
      setIsGroupExpanded(prev => ({...prev, [groupId]: !prev[groupId]}));
  };

  const handleSelectGroupMembers = (groupId: string, isSelected: boolean) => {
      const groupMemberIds = members.filter(m => (m.groupId || 'unassigned') === groupId).map(m => m.id);
      if (isSelected) {
          setSelectedMembers(prev => Array.from(new Set([...prev, ...groupMemberIds])));
      } else {
          setSelectedMembers(prev => prev.filter(id => !groupMemberIds.includes(id)));
      }
  };

  const handleSelectMember = (memberId: string, isSelected: boolean) => {
      if (isSelected) {
          setSelectedMembers(prev => [...prev, memberId]);
      } else {
          setSelectedMembers(prev => prev.filter(id => id !== memberId));
      }
  };

  const unassignedMembers = members.filter(m => !m.groupId);

  const handleAddNewMember = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberName.trim() || !onUpdateMembers) return;
      
      const newMember: Member = {
          id: generateId(),
          name: newMemberName.trim(),
          joinDate: new Date().toISOString(),
          groupId: newMemberGroupId || undefined
      };
      
      onUpdateMembers([...members, newMember]);
      setSelectedMembers(prev => [...prev, newMember.id]);
      setNewMemberName('');
      setIsAddingNewMember(false);
      
      const groupToExpand = newMemberGroupId || 'unassigned';
      setIsGroupExpanded(prev => ({...prev, [groupToExpand]: true}));
  };

  const handleSave = () => {
    const records: AttendanceRecord[] = Object.entries(attendance).map(([memberId, status]) => ({
      memberId,
      status: status as AttendanceStatus
    }));

    onSaveSession({
      id: initialSession ? initialSession.id : generateId(),
      date,
      topic,
      records
    });
    
    // Reset if not editing
    if (!initialSession) {
        setStep('details');
        setTopic('');
        setSelectedMembers(members.map(m => m.id));
    }
    alert(initialSession ? 'تم تعديل السجل بنجاح' : 'تم حفظ الحضور بنجاح');
    if (initialSession && onCancelEdit) {
        onCancelEdit();
    }
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
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-800">{initialSession ? 'تعديل بيانات الجلسة' : 'بيانات الجلسة'}</h2>
                  {initialSession && onCancelEdit && (
                      <button onClick={onCancelEdit} className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          إلغاء التعديل
                      </button>
                  )}
              </div>
              
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
                  <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2 mt-4">الأعضاء المشاركين</label>
                      <div className="space-y-3">
                          {groups.map(group => {
                              const groupMembers = members.filter(m => m.groupId === group.id);
                              if (groupMembers.length === 0) return null;
                              
                              const isGroupSelected = groupMembers.every(m => selectedMembers.includes(m.id));
                              const isGroupPartiallySelected = groupMembers.some(m => selectedMembers.includes(m.id)) && !isGroupSelected;
                              const isExpanded = isGroupExpanded[group.id];

                              return (
                                  <div key={group.id} className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                                      <div className="flex items-center justify-between p-3 bg-stone-100 border-b border-stone-200">
                                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                                              <input 
                                                  type="checkbox" 
                                                  checked={isGroupSelected}
                                                  ref={input => { if (input) input.indeterminate = isGroupPartiallySelected; }}
                                                  onChange={(e) => handleSelectGroupMembers(group.id, e.target.checked)}
                                                  className="w-5 h-5 text-blue-600 rounded border-stone-300 focus:ring-blue-500"
                                              />
                                              <span className="font-bold text-stone-800">{group.name}</span>
                                          </label>
                                          <button 
                                              onClick={() => toggleGroupSelectionExpand(group.id)}
                                              className="p-1 text-stone-500 hover:bg-stone-200 rounded-md"
                                          >
                                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                          </button>
                                      </div>
                                      
                                      {isExpanded && (
                                          <div className="p-2 space-y-1 bg-white">
                                              {groupMembers.map(member => (
                                                  <label key={member.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                                      <input 
                                                          type="checkbox" 
                                                          checked={selectedMembers.includes(member.id)}
                                                          onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                                                          className="w-4 h-4 text-blue-600 rounded border-stone-300 focus:ring-blue-500"
                                                      />
                                                      <span className="text-sm text-stone-700">{member.name}</span>
                                                  </label>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                          
                          {unassignedMembers.length > 0 && (() => {
                              const isGroupSelected = unassignedMembers.every(m => selectedMembers.includes(m.id));
                              const isGroupPartiallySelected = unassignedMembers.some(m => selectedMembers.includes(m.id)) && !isGroupSelected;
                              const isExpanded = isGroupExpanded['unassigned'];

                              return (
                                  <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                                      <div className="flex items-center justify-between p-3 bg-stone-100 border-b border-stone-200">
                                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                                              <input 
                                                  type="checkbox" 
                                                  checked={isGroupSelected}
                                                  ref={input => { if (input) input.indeterminate = isGroupPartiallySelected; }}
                                                  onChange={(e) => handleSelectGroupMembers('unassigned', e.target.checked)}
                                                  className="w-5 h-5 text-blue-600 rounded border-stone-300 focus:ring-blue-500"
                                              />
                                              <span className="font-bold text-stone-800">غير منضمين لمجموعات</span>
                                          </label>
                                          <button 
                                              onClick={() => toggleGroupSelectionExpand('unassigned')}
                                              className="p-1 text-stone-500 hover:bg-stone-200 rounded-md"
                                          >
                                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                          </button>
                                      </div>
                                      
                                      {isExpanded && (
                                          <div className="p-2 space-y-1 bg-white">
                                              {unassignedMembers.map(member => (
                                                  <label key={member.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                                      <input 
                                                          type="checkbox" 
                                                          checked={selectedMembers.includes(member.id)}
                                                          onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                                                          className="w-4 h-4 text-blue-600 rounded border-stone-300 focus:ring-blue-500"
                                                      />
                                                      <span className="text-sm text-stone-700">{member.name}</span>
                                                  </label>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              );
                          })()}
                      </div>
                      
                      {onUpdateMembers && (
                          <div className="mt-6 pt-4 border-t border-stone-200">
                              {!isAddingNewMember ? (
                                  <button 
                                      type="button"
                                      onClick={() => setIsAddingNewMember(true)}
                                      className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 font-bold flex items-center justify-center gap-2 hover:bg-stone-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                  >
                                      <UserPlus className="w-5 h-5" />
                                      تسجيل فرد جديد وإضافته للجلسة
                                  </button>
                              ) : (
                                  <form onSubmit={handleAddNewMember} className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                                      <h4 className="font-bold text-blue-800 mb-3 text-sm">تسجيل فرد جديد</h4>
                                      <div className="space-y-3">
                                          <input 
                                              type="text"
                                              value={newMemberName}
                                              onChange={e => setNewMemberName(e.target.value)}
                                              placeholder="اسم الفرد الرباعي..."
                                              className="w-full p-3 rounded-lg border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                          />
                                          <select 
                                              value={newMemberGroupId}
                                              onChange={e => setNewMemberGroupId(e.target.value)}
                                              className="w-full p-3 rounded-lg border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          >
                                              <option value="">بدون مجموعة (غير منضم)</option>
                                              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                          </select>
                                          <div className="flex gap-2 pt-1">
                                              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform">
                                                  حفظ وإضافة
                                              </button>
                                              <button type="button" onClick={() => setIsAddingNewMember(false)} className="px-4 bg-white text-stone-600 border border-stone-200 rounded-lg text-sm font-bold active:scale-95 transition-transform">
                                                  إلغاء
                                              </button>
                                          </div>
                                      </div>
                                  </form>
                              )}
                          </div>
                      )}
                  </div>
              </div>

              <button 
                onClick={() => setStep('list')}
                disabled={selectedMembers.length === 0}
                className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
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
              const groupMembers = members.filter(m => m.groupId === group.id && selectedMembers.includes(m.id));
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
          {unassignedMembers.filter(m => selectedMembers.includes(m.id)).length > 0 && (
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
                      {unassignedMembers.filter(m => selectedMembers.includes(m.id)).map(member => (
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
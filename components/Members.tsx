import React, { useState, useRef } from 'react';
import { Plus, Trash2, User, Upload, Users, MoreVertical, X, Check, BarChart2 } from 'lucide-react';
import { Member, Group, MeetingSession } from '../types';
import { generateId } from '../utils/storage';

interface MembersProps {
  members: Member[];
  groups: Group[];
  sessions: MeetingSession[];
  onUpdateMembers: (members: Member[]) => void;
  onUpdateGroups: (groups: Group[]) => void;
}

const Members: React.FC<MembersProps> = ({ members, groups, sessions, onUpdateMembers, onUpdateGroups }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  // State to track where we are adding a member (null = closed, 'unassigned' = no group, groupId = specific group)
  const [addingMemberTo, setAddingMemberTo] = useState<string | 'unassigned' | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [statsMemberId, setStatsMemberId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Group Handlers ---

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: Group = {
      id: generateId(),
      name: newGroupName.trim(),
    };

    onUpdateGroups([...groups, newGroup]);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المجموعة؟ سيتم نقل الأعضاء إلى "غير منضمين".')) {
      // 1. Remove group
      onUpdateGroups(groups.filter(g => g.id !== groupId));
      
      // 2. Unlink members
      const updatedMembers = members.map(m => 
        m.groupId === groupId ? { ...m, groupId: undefined } : m
      );
      onUpdateMembers(updatedMembers);
    }
  };

  // --- Member Handlers ---

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const targetGroupId = addingMemberTo === 'unassigned' ? undefined : addingMemberTo;

    const newMember: Member = {
      id: generateId(),
      name: newMemberName.trim(),
      joinDate: new Date().toISOString(),
      groupId: targetGroupId || undefined
    };

    onUpdateMembers([...members, newMember]);
    setNewMemberName('');
    // Keep the input open for rapid entry
    // document.getElementById('member-input')?.focus(); 
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('حذف هذا الجوال نهائياً؟')) {
      onUpdateMembers(members.filter(m => m.id !== id));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const names = text.split(/\r?\n/).map(n => n.trim()).filter(n => n.length > 0);
      
      const newMembers = names.map(name => ({
        id: generateId(),
        name,
        joinDate: new Date().toISOString(),
        groupId: undefined // Bulk import goes to unassigned
      }));

      onUpdateMembers([...members, ...newMembers]);
      alert(`تم استيراد ${newMembers.length} اسم بنجاح إلى القائمة العامة.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Group members by their groupId
  const groupedMembers: Record<string, Member[]> = {};
  const unassignedMembers: Member[] = [];

  members.forEach(m => {
      if (m.groupId && groups.find(g => g.id === m.groupId)) {
          if (!groupedMembers[m.groupId]) groupedMembers[m.groupId] = [];
          groupedMembers[m.groupId].push(m);
      } else {
          unassignedMembers.push(m);
      }
  });

  const renderMemberStats = () => {
    if (!statsMemberId) return null;
    const member = members.find(m => m.id === statsMemberId);
    if (!member) return null;

    let totalSessions = 0;
    let present = 0;
    let absent = 0;
    let excused = 0;

    sessions.forEach(session => {
      const record = session.records.find(r => r.memberId === statsMemberId);
      if (record) {
        totalSessions++;
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'excused') excused++;
      }
    });

    const attendanceRate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-fade-in">
          <div className="bg-blue-900 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-lg">إحصائيات الجوال</h3>
            <button onClick={() => setStatsMemberId(null)} className="text-blue-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                {member.name.charAt(0)}
              </div>
              <h4 className="font-bold text-xl text-stone-800">{member.name}</h4>
              <p className="text-stone-500 text-sm mt-1">
                {member.groupId ? groups.find(g => g.id === member.groupId)?.name : 'غير منضم لمجموعة'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
                <span className="block text-2xl font-bold text-stone-800">{totalSessions}</span>
                <span className="text-xs text-stone-500 font-medium">إجمالي الجلسات</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                <span className="block text-2xl font-bold text-blue-700">{attendanceRate}%</span>
                <span className="text-xs text-blue-600 font-medium">نسبة الحضور</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-800 font-medium">حضور</span>
                <span className="font-bold text-green-700 text-lg">{present}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                <span className="text-red-800 font-medium">غياب</span>
                <span className="font-bold text-red-700 text-lg">{absent}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-amber-800 font-medium">استئذان</span>
                <span className="font-bold text-amber-700 text-lg">{excused}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {renderMemberStats()}
      
      {/* Header Actions */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-stone-800">هيكل العشيرة</h2>
                <p className="text-stone-400 text-xs font-medium">إجمالي الجوالة: {members.length}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-100 text-stone-600 p-2.5 rounded-xl active:bg-stone-200 transition-colors"
                    title="استيراد أسماء من ملف"
                >
                    <Upload className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setIsAddingGroup(true)}
                    className="bg-blue-800 text-white px-4 py-2 rounded-xl shadow-md active:bg-blue-900 transition-colors flex items-center text-sm font-bold"
                >
                    <Plus className="w-4 h-4 ml-2" />
                    مجموعة جديدة
                </button>
            </div>
        </div>

        {/* Add Group Form */}
        {isAddingGroup && (
            <form onSubmit={handleAddGroup} className="flex gap-2 animate-fade-in bg-blue-50 p-2 rounded-lg border border-blue-100">
                <input 
                    type="text" 
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="اسم المجموعة (الرهط)..."
                    className="flex-1 px-3 py-2 rounded-md border border-blue-200 text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
                    <Check className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIsAddingGroup(false)} className="bg-white text-stone-500 p-2 rounded-md hover:text-red-500 border border-stone-200">
                    <X className="w-4 h-4" />
                </button>
            </form>
        )}
      </div>

      {/* Hidden File Input */}
      <input type="file" accept=".txt,.csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* GROUPS LIST */}
      <div className="space-y-4">
        {groups.map(group => {
            const groupMembers = groupedMembers[group.id] || [];
            const isAddingHere = addingMemberTo === group.id;

            return (
                <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-stone-50 p-3 flex justify-between items-center border-b border-stone-100">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-stone-800">{group.name}</h3>
                            <span className="bg-white text-stone-500 text-[10px] px-2 py-0.5 rounded-full border border-stone-200 font-bold">
                                {groupMembers.length}
                            </span>
                        </div>
                        <button 
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-stone-400 hover:text-red-500 p-1"
                            title="حذف المجموعة"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Members in Group */}
                    <div className="p-3 space-y-2">
                        {groupMembers.length === 0 && !isAddingHere && (
                            <p className="text-center text-xs text-stone-400 py-2">لا يوجد أعضاء في هذه المجموعة</p>
                        )}
                        
                        {groupMembers.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-stone-700">{member.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setStatsMemberId(member.id)} className="text-stone-300 hover:text-blue-500 p-1" title="إحصائيات">
                                        <BarChart2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteMember(member.id)} className="text-stone-300 hover:text-red-500 p-1" title="حذف">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Member Input Area */}
                        {isAddingHere ? (
                            <form onSubmit={handleAddMember} className="flex gap-2 mt-2 pt-2 border-t border-dashed border-stone-200">
                                <input 
                                    id="member-input"
                                    type="text" 
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    placeholder="اسم العضو..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                />
                                <button type="submit" className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setAddingMemberTo(null)} className="bg-stone-100 text-stone-500 p-2 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <button 
                                onClick={() => { setAddingMemberTo(group.id); setNewMemberName(''); }}
                                className="w-full py-2 mt-1 border-t border-dashed border-stone-200 text-stone-400 hover:text-blue-600 hover:bg-stone-50 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> إضافة عضو
                            </button>
                        )}
                    </div>
                </div>
            );
        })}

        {/* UNASSIGNED MEMBERS SECTION */}
        <div className="bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-stone-500">
                    <User className="w-5 h-5" />
                    <h3 className="font-bold">غير منضمين لمجموعة</h3>
                    <span className="bg-stone-200 text-stone-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {unassignedMembers.length}
                    </span>
                </div>
                {!addingMemberTo && (
                    <button 
                        onClick={() => { setAddingMemberTo('unassigned'); setNewMemberName(''); }}
                        className="text-blue-600 text-xs font-bold hover:underline"
                    >
                        + إضافة
                    </button>
                )}
            </div>

            {addingMemberTo === 'unassigned' && (
                <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        placeholder="اسم العضو..."
                        className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                        <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setAddingMemberTo(null)} className="bg-white text-stone-500 p-2 rounded-lg border border-stone-200">
                        <X className="w-4 h-4" />
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-2">
                {unassignedMembers.length === 0 ? (
                    <p className="text-center text-stone-400 text-xs">جميع الأعضاء في مجموعات</p>
                ) : (
                    unassignedMembers.map(member => (
                        <div key={member.id} className="bg-white p-2 rounded-lg border border-stone-200 flex justify-between items-center shadow-sm">
                             <span className="text-sm font-medium text-stone-700 px-2">{member.name}</span>
                             <div className="flex items-center gap-1">
                                 <button onClick={() => setStatsMemberId(member.id)} className="text-stone-300 hover:text-blue-500 p-1" title="إحصائيات">
                                     <BarChart2 className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDeleteMember(member.id)} className="text-stone-300 hover:text-red-500 p-1" title="حذف">
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Members;
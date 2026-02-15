import React, { useState, useRef } from 'react';
import { Plus, Trash2, UserPlus, User, Calendar, Upload } from 'lucide-react';
import { Member } from '../types';
import { generateId } from '../utils/storage';

interface MembersProps {
  members: Member[];
  onUpdateMembers: (members: Member[]) => void;
}

const Members: React.FC<MembersProps> = ({ members, onUpdateMembers }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMember = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: Member = {
      id: generateId(),
      name: newMemberName.trim(),
      joinDate: new Date().toISOString(),
    };

    onUpdateMembers([...members, newMember]);
    setNewMemberName('');
    setIsAdding(false);
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

      // Split by new lines, filter empty, create members
      const names = text.split(/\r?\n/).map(n => n.trim()).filter(n => n.length > 0);
      
      const newMembers = names.map(name => ({
        id: generateId(),
        name,
        joinDate: new Date().toISOString()
      }));

      onUpdateMembers([...members, ...newMembers]);
      alert(`تم استيراد ${newMembers.length} اسم بنجاح.`);
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100 sticky top-0 z-10">
        <div>
            <h2 className="text-xl font-bold text-stone-800">قائمة الجوالة</h2>
            <p className="text-stone-400 text-xs font-medium">العدد الكلي: {members.length}</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-stone-100 text-stone-600 p-2.5 rounded-xl active:bg-stone-200 transition-colors"
                title="استيراد أسماء"
            >
                <Upload className="w-6 h-6" />
            </button>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:bg-blue-700 transition-colors"
                title="إضافة عضو"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
        {/* Hidden File Input */}
        <input 
            type="file" 
            accept=".txt,.csv" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
        />
      </div>

      {/* Add Member Drawer/Area */}
      {isAdding && (
          <form onSubmit={handleAddMember} className="bg-white p-4 rounded-xl shadow-md border border-stone-200 animate-fade-in space-y-4 mx-1">
              <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-stone-700">إضافة عضو يدوياً</label>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-red-500 font-bold">إغلاق</button>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="الاسم الثلاثي..."
                    autoFocus
                  />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">حفظ الاسم</button>
          </form>
      )}

      {/* Members List - Cards */}
      <div className="grid gap-3">
        {members.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold">القائمة فارغة</p>
            <p className="text-sm mt-2">اضغط على زر (+) للإضافة أو زر (رفع) لاستيراد ملف.</p>
          </div>
        ) : (
          [...members].reverse().map((member) => (
            <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-lg border border-stone-200">
                    {member.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-stone-800 text-base">{member.name}</h3>
                    <div className="flex items-center text-xs text-stone-400 mt-1">
                        <Calendar className="w-3 h-3 ml-1" />
                        {new Date(member.joinDate).toLocaleDateString('ar-OM')}
                    </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteMember(member.id)}
                className="w-9 h-9 flex items-center justify-center text-stone-300 hover:text-red-500 active:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Members;
import React, { useState, useRef } from 'react';
import { Save, Upload, User, Flag, Trash2, Download, FileJson, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { AppSettings } from '../types';
import { Storage } from '../utils/storage';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onDataRestored?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSaveSettings, onDataRestored }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
          alert("حجم الملف كبير جداً. يرجى رفع صورة أصغر (أقل من 500 كيلوبايت) للأداء.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
      setFormData(prev => ({ ...prev, logoUrl: null }));
      if (logoInputRef.current) logoInputRef.current.value = '';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- Backup Functions ---

  const handleExportBackup = () => {
    const data = Storage.getFullBackup();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `saham_scout_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (window.confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بحذف البيانات الحالية واستبدالها بالبيانات الموجودة في الملف. هل أنت متأكد؟')) {
                const success = Storage.restoreBackup(json);
                if (success) {
                    setRestoreStatus('success');
                    if (onDataRestored) onDataRestored();
                    // Update local form data if settings changed
                    if (json.settings) setFormData(prev => ({ ...prev, ...json.settings }));
                    setTimeout(() => setRestoreStatus('idle'), 3000);
                } else {
                    setRestoreStatus('error');
                }
            }
        } catch (err) {
            console.error(err);
            setRestoreStatus('error');
        }
    };
    reader.readAsText(file);
    // Reset input
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">الإعدادات</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-6 mb-6">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-6 pb-6 border-b border-stone-100">
            <div className="w-32 h-32 rounded-full bg-stone-100 border-4 border-stone-200 overflow-hidden mb-4 relative group">
                {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Troop Logo" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Flag className="w-12 h-12" />
                    </div>
                )}
            </div>
            <div className="flex space-x-3 space-x-reverse">
                <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium flex items-center transition-colors"
                >
                    <Upload className="w-4 h-4 ml-2" /> رفع الشعار
                </button>
                {formData.logoUrl && (
                    <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                        <Trash2 className="w-4 h-4 ml-2" /> إزالة
                    </button>
                )}
            </div>
            <input 
                type="file" 
                ref={logoInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">اسم العشيرة</label>
          <div className="relative">
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Flag className="h-5 w-5 text-stone-400" />
            </div>
            <input
                type="text"
                name="troopName"
                value={formData.troopName}
                onChange={handleChange}
                className="block w-full pr-10 pl-3 py-2 border border-stone-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">اسم القائد</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-stone-400" />
            </div>
            <input
                type="text"
                name="leaderName"
                value={formData.leaderName}
                onChange={handleChange}
                className="block w-full pr-10 pl-3 py-2 border border-stone-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1"> منسق العشيرةوأمين السر</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-stone-400" />
            </div>
            <input
                type="text"
                name="coordinatorName"
                value={formData.coordinatorName || ''}
                onChange={handleChange}
                className="block w-full pr-10 pl-3 py-2 border border-stone-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="الاسم الثلاثي"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
            {isSaved && <span className="text-blue-600 font-medium animate-pulse text-sm">تم حفظ الإعدادات!</span>}
            {!isSaved && <span></span>}
            <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center transition-colors"
            >
                <Save className="w-5 h-5 ml-2" />
                حفظ
            </button>
        </div>
      </form>

      {/* Backup & Restore Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center">
              <FileJson className="w-5 h-5 ml-2 text-stone-500" />
              إدارة البيانات
          </h3>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              لحماية بياناتك من الضياع، يمكنك حفظ نسخة احتياطية من جميع السجلات والأعضاء. احتفظ بالملف في مكان آمن لاستعادته لاحقاً.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center p-4 border border-stone-200 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors text-stone-700 font-bold"
              >
                  <Download className="w-5 h-5 ml-2" />
                  تصدير نسخة احتياطية
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="flex items-center justify-center p-4 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-blue-800 font-bold"
              >
                  <Upload className="w-5 h-5 ml-2" />
                  استعادة نسخة احتياطية
              </button>
              <input 
                type="file" 
                ref={backupInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />
          </div>

          {restoreStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
                  <CheckCircle className="w-5 h-5 ml-2" />
                  تم استعادة البيانات بنجاح!
              </div>
          )}
          
          {restoreStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                  <AlertTriangle className="w-5 h-5 ml-2" />
                  حدث خطأ أثناء استعادة الملف. تأكد من أن الملف صحيح.
              </div>
          )}
      </div>
    </div>
  );
};

export default Settings;
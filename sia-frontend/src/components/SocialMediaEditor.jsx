import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Camera, Briefcase, MessageCircle, Users, Video, Link as LinkIcon, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const socialPlatforms = [
  { id: 'instagram', label: 'Instagram', icon: Camera },
  { id: 'linkedin', label: 'LinkedIn', icon: Briefcase },
  { id: 'tiktok', label: 'TikTok', icon: null }, // Handled specially
  { id: 'twitter', label: 'Twitter/X', icon: MessageCircle },
  { id: 'facebook', label: 'Facebook', icon: Users },
  { id: 'youtube', label: 'YouTube', icon: Video },
  { id: 'website', label: 'Website Lain', icon: Globe }
];

export function getPlatformIcon(platformId, size = 16) {
  const p = socialPlatforms.find(p => p.id === platformId);
  if (p && p.icon) {
    const Icon = p.icon;
    return <Icon size={size} />;
  }
  if (platformId === 'tiktok') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    );
  }
  return <LinkIcon size={size} />;
}

const CustomSelect = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.id === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{getPlatformIcon(selectedOpt.id)}</span>
          {selectedOpt.label}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1.5 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map(o => (
              <div 
                key={o.id}
                onClick={() => { onChange(o.id); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm font-bold flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${o.id === value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
              >
                <span className={o.id === value ? 'text-blue-600' : 'text-slate-400'}>{getPlatformIcon(o.id)}</span>
                {o.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SocialMediaEditor({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([...(value || []), { platform: 'instagram', username: '', link: '' }]);
  };

  const handleRemove = (index) => {
    const newVal = [...(value || [])];
    newVal.splice(index, 1);
    onChange(newVal);
  };

  const handleChange = (index, field, val) => {
    const newVal = [...(value || [])];
    newVal[index][field] = val;
    onChange(newVal);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Sosial Media Resmi</label>
        <button type="button" onClick={handleAdd} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-widest">
          <Plus size={12} /> Tambah Platform
        </button>
      </div>
      
      {(!value || value.length === 0) && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400">
          <LinkIcon size={32} className="mb-2 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-widest">Belum Ada Tautan</p>
          <p className="text-[10px] mt-1 font-medium max-w-[200px]">Tambahkan sosial media untuk ditampilkan di portal alumni.</p>
        </div>
      )}

      <div className="space-y-3">
        {(value || []).map((item, index) => (
          <div key={index} style={{ zIndex: 50 - index }} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-200 relative group transition-colors hover:bg-slate-50">
            <div className="md:col-span-4 space-y-1.5 relative z-20">
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Platform</label>
               <CustomSelect 
                  value={item.platform} 
                  options={socialPlatforms} 
                  onChange={(val) => handleChange(index, 'platform', val)} 
               />
            </div>
            <div className="md:col-span-4 space-y-1.5 relative z-10">
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username / ID</label>
               <input 
                  type="text" 
                  value={item.username} 
                  onChange={e => handleChange(index, 'username', e.target.value)} 
                  placeholder="@username" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none shadow-sm transition-colors" 
                />
            </div>
            <div className="md:col-span-4 space-y-1.5 relative z-10">
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tautan Web (Opsional)</label>
               <div className="flex gap-2">
                 <input 
                    type="url" 
                    value={item.link} 
                    onChange={e => handleChange(index, 'link', e.target.value)} 
                    placeholder="https://..." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:border-blue-500 outline-none shadow-sm transition-colors" 
                  />
                 <button 
                    type="button" 
                    onClick={() => handleRemove(index)} 
                    className="shrink-0 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm"
                    title="Hapus"
                  >
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

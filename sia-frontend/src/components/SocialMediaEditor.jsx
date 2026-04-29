import React from 'react';
import { Plus, Trash2, Camera, Briefcase, MessageCircle, Users, Video, Link as LinkIcon, Globe } from 'lucide-react';

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Sosial Media</label>
        <button type="button" onClick={handleAdd} className="text-xs font-bold text-brand-primary hover:text-brand-dark flex items-center gap-1">
          <Plus size={14} /> Tambah
        </button>
      </div>
      
      {(!value || value.length === 0) && (
        <div className="text-center py-4 border border-dashed border-border-subtle rounded-xl text-xs text-secondary/60">
          Belum ada sosial media ditambahkan.
        </div>
      )}

      {(value || []).map((item, index) => (
        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-main p-3 rounded-xl border border-border-subtle relative group">
          <div className="sm:col-span-4 space-y-1.5">
             <label className="text-[10px] font-bold text-secondary/70 uppercase">Platform</label>
             <select value={item.platform} onChange={e => handleChange(index, 'platform', e.target.value)} className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:border-brand-primary outline-none">
                {socialPlatforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
             </select>
          </div>
          <div className="sm:col-span-4 space-y-1.5">
             <label className="text-[10px] font-bold text-secondary/70 uppercase">Username</label>
             <input type="text" value={item.username} onChange={e => handleChange(index, 'username', e.target.value)} placeholder="@username" className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:border-brand-primary outline-none" />
          </div>
          <div className="sm:col-span-4 space-y-1.5">
             <label className="text-[10px] font-bold text-secondary/70 uppercase">Link (Opsional)</label>
             <div className="flex gap-2">
               <input type="url" value={item.link} onChange={e => handleChange(index, 'link', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:border-brand-primary outline-none" />
               <button type="button" onClick={() => handleRemove(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                 <Trash2 size={16} />
               </button>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Phone, Globe, MapPin, Camera, 
  Save, Loader2, CheckCircle2, AlertCircle, Edit3,
  Link as LinkIcon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import CustomSelect from '../components/CustomSelect';
import RegionSelect from '../components/RegionSelect';
import SocialMediaEditor from '../components/SocialMediaEditor';

const sektorOptions = [
  'Teknologi Informasi', 'Manufaktur', 'Keuangan & Perbankan', 'Kesehatan',
  'Pendidikan', 'Konstruksi', 'Perdagangan', 'Transportasi & Logistik',
  'Media & Komunikasi', 'Pertanian', 'Energi', 'Pariwisata & Hospitality',
  'Pemerintahan', 'Lainnya'
];

export default function IndustryCompanyProfile() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const logoRef = useRef(null);
  const bannerRef = useRef(null);

  const [form, setForm] = useState({
    nama: '',
    industri: '',
    deskripsi: '',
    email: '',
    no_hp: '',
    website: '',
    alamat: '',
    kota: '',
    provinsi: '',
    kecamatan: '',
    kelurahan: '',
    social_media: []
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const record = await pb.collection('companies').getFirstListItem(`user="${user?.id}"`);
        setCompany(record);
        setForm({
          nama: record.nama || '',
          industri: record.industri || '',
          deskripsi: record.deskripsi || '',
          email: record.email || '',
          no_hp: record.no_hp || '',
          website: record.website || '',
          alamat: record.alamat || '',
          kota: record.kota || '',
          provinsi: record.provinsi || '',
          kecamatan: record.kecamatan || '',
          kelurahan: record.kelurahan || '',
          social_media: Array.isArray(record.social_media) ? record.social_media : (typeof record.social_media === 'string' ? JSON.parse(record.social_media || '[]') : []),
        });
        if (record.logo) setLogoPreview(pb.files.getUrl(record, record.logo));
        if (record.banner) setBannerPreview(pb.files.getUrl(record, record.banner));
      } catch (err) {
        console.error('Failed to fetch company:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchCompany();
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!company?.id) return;

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'social_media') formData.append(key, JSON.stringify(val));
        else formData.append(key, val);
      });
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const updated = await pb.collection('companies').update(company.id, formData);
      setCompany(updated);
      setLogoFile(null);
      setBannerFile(null);
      showToast('Profil perusahaan berhasil diperbarui!');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Gagal menyimpan. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Memuat profil...
      </div>
    );
  }

  const bannerUrl = bannerPreview;
  const logoUrl = logoPreview;

  return (
    <div className="w-full space-y-4 pb-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl font-black text-sm border flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
        {/* Banner */}
        <div className="h-52 relative overflow-hidden bg-slate-200 group">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-80" />
          )}
          <button onClick={() => bannerRef.current?.click()} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
            <Camera size={18} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-10 pb-10">
          <div className="relative flex justify-between items-end">
            {/* Logo */}
            <div className="-mt-16 w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden relative group">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <Building2 size={48} />
                </div>
              )}
              <div 
                onClick={() => logoRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="text-white" size={24} />
              </div>
            </div>

            <div className="flex gap-3 mb-2">
              <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Profil
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{form.nama || 'Nama Perusahaan'}</h1>
              {company?.verified && (
                <span className="p-1 bg-blue-50 text-blue-600 rounded-full" title="Terverifikasi">
                  <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                </span>
              )}
            </div>
            <p className="text-blue-600 font-bold text-sm mt-1">{form.industri || 'Bidang Industri'}</p>
            
            <div className="flex flex-wrap items-center gap-6 mt-6 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {form.kota}, {form.provinsi}</div>
              <div className="flex items-center gap-2"><Globe size={16} className="text-slate-400" /> {form.website || 'Website belum diatur'}</div>
              <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {form.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}} />
      <input type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); }}} />

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Info (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-600" /> Tentang Perusahaan
            </h2>
            <textarea 
              value={form.deskripsi} 
              onChange={(e) => setForm({...form, deskripsi: e.target.value})}
              className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-sm text-slate-700 leading-relaxed outline-none focus:border-blue-200 focus:bg-white transition-all resize-none h-48 shadow-inner"
              placeholder="Tuliskan profil singkat perusahaan Anda..."
            />
          </div>

          {/* Wilayah Operasional - Now much wider */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
             <h2 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
               <MapPin size={18} className="text-blue-600" /> Wilayah Operasional
             </h2>
             <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                <RegionSelect formData={form} handleChange={(e)=>setForm({...form, [e.target.name]: e.target.value})} isIndonesia={true} />
             </div>
             <div className="mt-8 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Kantor Pusat</label>
                <textarea 
                  value={form.alamat} 
                  onChange={(e) => setForm({...form, alamat: e.target.value})}
                  className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-sm text-slate-700 leading-relaxed outline-none focus:border-blue-200 focus:bg-white transition-all resize-none h-24"
                  placeholder="Nama jalan, nomor gedung, dsb..."
                />
             </div>
          </div>
        </div>

        {/* Right Column: Sidebar Info (1/3) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
            <h2 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> Informasi Bisnis
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sektor Industri</label>
                 <CustomSelect 
                    value={form.industri} 
                    onChange={e => setForm({...form, industri: e.target.value})} 
                    options={sektorOptions}
                    placeholder="Pilih Sektor Industri"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telepon Kantor</label>
                 <div className="relative group">
                   <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                   <input value={form.no_hp} onChange={e=>setForm({...form, no_hp: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all" placeholder="+62..." />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Resmi</label>
                 <div className="relative group">
                   <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                   <input value={form.website} onChange={e=>setForm({...form, website: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all" placeholder="https://..." />
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
             <h2 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
               <LinkIcon size={18} className="text-blue-600" /> Tautan Terkait
             </h2>
             <SocialMediaEditor value={form.social_media} onChange={val => setForm({...form, social_media: val})} />
          </div>
        </div>
      </div>
    </div>
  );
}

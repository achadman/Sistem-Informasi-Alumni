import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Upload, Building, Mail, Phone, MapPin, 
  Loader2, CheckCircle2, Camera, Edit2, KeyRound, 
  ImageIcon, Globe, ShieldCheck, Share2
} from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import SocialMediaEditor, { getPlatformIcon, socialPlatforms } from '../components/SocialMediaEditor';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstitutionProfile() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_hp: '',
    deskripsi: '',
    alamat: '',
    negara: 'Indonesia',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    rw: '',
    rt: '',
    social_media: []
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await pb.collection('institution_profile').getFirstListItem('').catch(() => null);
      
      if (data) {
        setProfileId(data.id);
        const loadedData = {
          nama: data.nama || '',
          email: data.email || '',
          no_hp: data.no_hp || '',
          deskripsi: data.deskripsi || '',
          alamat: data.alamat || '',
          negara: 'Indonesia',
          provinsi: data.provinsi || '',
          kota: data.kota || '',
          kecamatan: data.kecamatan || '',
          kelurahan: data.kelurahan || '',
          rw: data.rw || '',
          rt: data.rt || '',
          social_media: Array.isArray(data.social_media) ? data.social_media : (typeof data.social_media === 'string' ? JSON.parse(data.social_media || '[]') : [])
        };
        setFormData(loadedData);
        
        if (data.logo) setLogoPreview(pb.files.getUrl(data, data.logo));
        if (data.banner) setBannerPreview(pb.files.getUrl(data, data.banner));
      }
    } catch (err) {
      console.error("Fetch Profile Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'negara') {
          if (key === 'social_media') data.append(key, JSON.stringify(formData[key]));
          else data.append(key, formData[key]);
        }
      });
      
      if (logoFile) data.append('logo', logoFile);
      if (bannerFile) data.append('banner', bannerFile);

      if (profileId) {
        await pb.collection('institution_profile').update(profileId, data);
      } else {
        const record = await pb.collection('institution_profile').create(data);
        setProfileId(record.id);
      }
      
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Gagal menyimpan profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3 text-blue-600" />
        Memuat profil institusi...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* LinkedIn Style Profile Header */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-56 relative bg-slate-100 group">
          {bannerPreview ? (
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600/20 via-slate-100 to-blue-600/10" />
          )}
          <button 
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <ImageIcon size={14} /> Ganti Foto Sampul
            </span>
          </button>
          <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const f = e.target.files[0]; if(f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); }
          }} />
        </div>

        <div className="px-10 pb-10 relative">
          {/* Circular Logo Overlapping Banner */}
          <div className="w-44 h-44 rounded-full border-8 border-white bg-white absolute -top-22 left-10 shadow-xl overflow-hidden flex items-center justify-center z-10 group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-6xl font-bold text-slate-200 uppercase">
                {formData.nama?.charAt(0) || <Building size={64}/>}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={32} />
            </div>
          </div>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const f = e.target.files[0]; if(f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
          }} />

          {/* Action Buttons */}
          <div className="flex justify-end pt-6 gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-md ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isEditing ? <Loader2 size={16} /> : <Edit2 size={16} />}
              {isEditing ? 'Batal Edit' : 'Edit Profil Institusi'}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{formData.nama || 'Nama Institusi Belum Diatur'}</h1>
                <p className="text-lg text-slate-500 font-medium">{formData.deskripsi || 'Slogan atau deskripsi institusi akan tampil di sini.'}</p>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <Mail size={14} className="text-blue-500" /> {formData.email || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <Phone size={14} className="text-blue-500" /> {formData.no_hp || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <MapPin size={14} className="text-blue-500" /> 
                    {[formData.kota, formData.provinsi].filter(Boolean).join(', ') || 'Lokasi belum diatur'}
                  </div>
                </div>
              </div>

              {/* Social Media Badges */}
              <div className="flex flex-wrap gap-2">
                {formData.social_media?.map((sm, i) => (
                  <a 
                    key={i} 
                    href={sm.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-white border border-slate-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-600 shadow-sm"
                    title={sm.platform}
                  >
                    {getPlatformIcon(sm.platform, 20)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg"
          >
            <form onSubmit={handleSave} className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Formulir Pengeditan</h2>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                  SIMPAN PERUBAHAN
                </button>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-bold">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Institusi</label>
                  <input 
                    required 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Resmi</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Slogan</label>
                  <textarea 
                    value={formData.deskripsi} 
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium h-32 resize-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon</label>
                  <input 
                    value={formData.no_hp} 
                    onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                  <input 
                    value={formData.alamat} 
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Detail Wilayah</h3>
                <RegionSelect formData={formData} handleChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} isIndonesia={true} />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <SocialMediaEditor 
                  value={formData.social_media} 
                  onChange={(newVal) => setFormData({...formData, social_media: newVal})} 
                />
              </div>

              <div className="flex justify-end pt-6">
                <button type="submit" disabled={isSubmitting} className="px-12 py-4 bg-slate-900 text-white rounded-full font-bold shadow-2xl hover:bg-black transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest text-xs">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                  Simpan Semua Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
               <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <ShieldCheck className="text-blue-600" /> Visi & Deskripsi Institusi
                  </h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {formData.deskripsi || 'Belum ada deskripsi yang ditambahkan untuk institusi ini.'}
                  </p>
               </div>
               
               <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <MapPin className="text-blue-600" /> Lokasi & Kontak Resmi
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Fisik</span>
                        <p className="text-slate-700 font-bold">{formData.alamat || '-'}</p>
                        <p className="text-slate-500 text-sm">
                          {[formData.kecamatan, formData.kota, formData.provinsi].filter(Boolean).join(', ')}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email & Telp</span>
                        <p className="text-slate-700 font-bold">{formData.email || '-'}</p>
                        <p className="text-slate-700 font-bold">{formData.no_hp || '-'}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-blue-400" /> Media Sosial
                  </h3>
                  <div className="space-y-4">
                    {formData.social_media?.length > 0 ? formData.social_media.map((sm, i) => (
                      <a key={i} href={sm.link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10 group">
                        <div className="flex items-center gap-3">
                          <span className="text-blue-400 group-hover:scale-110 transition-transform">
                            {getPlatformIcon(sm.platform, 20)}
                          </span>
                          <span className="text-sm font-bold">{sm.username || sm.platform}</span>
                        </div>
                        <Share2 size={14} className="text-white/40" />
                      </a>
                    )) : <p className="text-white/40 text-xs italic">Belum ada sosial media.</p>}
                  </div>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

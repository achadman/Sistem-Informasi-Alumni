import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Building, Mail, Phone, MapPin, 
  Loader2, CheckCircle2, FileText, Calendar, 
  Settings, Globe, ShieldCheck, Clock, Camera,
  Edit2, ImageIcon, Share2
} from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import SocialMediaEditor, { getPlatformIcon } from '../components/SocialMediaEditor';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('institusi');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Institution Form Data
  const [instId, setInstId] = useState(null);
  const [instData, setInstData] = useState({
    nama: '',
    email: '',
    no_hp: '',
    deskripsi: '',
    alamat: '',
    negara: 'Indonesia',
    provinsi: '',
    kota_kabupaten: '',
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

  // Tracer Study Form Data
  const [tracerId, setTracerId] = useState(null);
  const [tracerData, setTracerData] = useState({
    is_active: true,
    start_date: '',
    end_date: '',
    target_years: '',
    title: 'Kuesioner Tracer Study Alumni',
    welcome_message: 'Halo Alumni! Mohon luangkan waktu sejenak untuk mengisi data rekapitulasi karir Anda guna membantu peningkatan mutu institusi.'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Institution Profile
      const instRec = await pb.collection('institution_profile').getFirstListItem('').catch(() => null);
      if (instRec) {
        setInstId(instRec.id);
        const loadedInst = {
          nama: instRec.nama || '',
          email: instRec.email || '',
          no_hp: instRec.no_hp || '',
          deskripsi: instRec.deskripsi || '',
          alamat: instRec.alamat || '',
          negara: 'Indonesia',
          provinsi: instRec.provinsi || '',
          kota_kabupaten: instRec.kota || '',
          kecamatan: instRec.kecamatan || '',
          kelurahan: instRec.kelurahan || '',
          rw: instRec.rw || '',
          rt: instRec.rt || '',
          social_media: Array.isArray(instRec.social_media) ? instRec.social_media : (typeof instRec.social_media === 'string' ? JSON.parse(instRec.social_media || '[]') : [])
        };
        setInstData(loadedInst);
        if (instRec.logo) setLogoPreview(pb.files.getUrl(instRec, instRec.logo));
        if (instRec.banner) setBannerPreview(pb.files.getUrl(instRec, instRec.banner));
      }

      // Fetch Tracer Settings
      const tracerRec = await pb.collection('tracer_settings').getFirstListItem('').catch(() => null);
      if (tracerRec) {
        setTracerId(tracerRec.id);
        setTracerData({
          is_active: tracerRec.is_active,
          start_date: tracerRec.start_date ? tracerRec.start_date.substring(0, 16) : '',
          end_date: tracerRec.end_date ? tracerRec.end_date.substring(0, 16) : '',
          target_years: tracerRec.target_years || '',
          title: tracerRec.title || 'Kuesioner Tracer Study Alumni',
          welcome_message: tracerRec.welcome_message || ''
        });
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstitusi = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(instData).forEach(key => {
        if (key !== 'negara') {
           if (key === 'kota_kabupaten') data.append('kota', instData[key]);
           else if (key === 'social_media') data.append(key, JSON.stringify(instData[key]));
           else data.append(key, instData[key]);
        }
      });
      if (logoFile) data.append('logo', logoFile);
      if (bannerFile) data.append('banner', bannerFile);

      if (instId) {
        await pb.collection('institution_profile').update(instId, data);
      } else {
        const record = await pb.collection('institution_profile').create(data);
        setInstId(record.id);
      }
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
      fetchAllData();
    } catch (err) {
      setError("Gagal simpan profil: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTracer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = { ...tracerData };
      if (tracerId) {
        await pb.collection('tracer_settings').update(tracerId, data);
      } else {
        const record = await pb.collection('tracer_settings').create(data);
        setTracerId(record.id);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Gagal simpan tracer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3 text-blue-600" />
        Memuat konfigurasi...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pusat Konfigurasi</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola identitas institusi dan pengaturan sistem Tracer Study.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-6 py-2 rounded-full font-bold border border-green-200 shadow-sm text-xs">
            <CheckCircle2 size={16} /> BERHASIL DISIMPAN
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-3xl w-fit">
        <button 
          onClick={() => setActiveTab('institusi')}
          className={`px-8 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all ${activeTab === 'institusi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Profil Institusi
        </button>
        <button 
          onClick={() => setActiveTab('tracer')}
          className={`px-8 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all ${activeTab === 'tracer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Tracer Study
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'institusi' ? (
          <motion.div 
            key="inst"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Profile Header LinkedIn Style */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="h-48 relative bg-slate-200 group">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600/20 to-indigo-600/10" />
                )}
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <span className="bg-white/90 text-slate-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">Ganti Sampul</span>
                </button>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e)=>{
                  const f=e.target.files[0]; if(f){ setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); }
                }}/>
              </div>
              <div className="px-10 pb-10 relative">
                <div className="w-40 h-40 rounded-full border-8 border-white bg-white absolute -top-20 left-10 shadow-xl overflow-hidden flex items-center justify-center group cursor-pointer" onClick={()=>logoInputRef.current?.click()}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building size={48} className="text-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e)=>{
                  const f=e.target.files[0]; if(f){ setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                }}/>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all shadow-lg"
                  >
                    {isEditing ? 'Batal Edit' : 'Edit Profil'}
                  </button>
                </div>

                <div className="mt-16">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{instData.nama || 'Nama Institusi'}</h1>
                  <p className="text-slate-500 font-medium mt-1">{instData.deskripsi || 'Belum ada deskripsi.'}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                      <Mail size={14} className="text-blue-500" /> {instData.email || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                      <Phone size={14} className="text-blue-500" /> {instData.no_hp || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                      <MapPin size={14} className="text-blue-500" /> {instData.kota_kabupaten || 'Lokasi belum diatur'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg animate-in slide-in-from-top-4 duration-500">
                <form onSubmit={handleSaveInstitusi} className="space-y-10">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Formulir Pengaturan</h2>
                      <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] tracking-widest uppercase hover:bg-black transition-all flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SIMPAN PERUBAHAN
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Resmi Institusi</label>
                        <input value={instData.nama} onChange={e=>setInstData({...instData,nama:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Kontak</label>
                        <input value={instData.email} onChange={e=>setInstData({...instData,email:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"/>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                        <textarea value={instData.deskripsi} onChange={e=>setInstData({...instData,deskripsi:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium h-32 resize-none transition-all"/>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Detail Wilayah & Media Sosial</h3>
                      <div className="space-y-8">
                        <RegionSelect formData={instData} handleChange={e=>setInstData({...instData,[e.target.name]:e.target.value})} isIndonesia={true} />
                        <SocialMediaEditor value={instData.social_media} onChange={val=>setInstData({...instData,social_media:val})} />
                      </div>
                   </div>
                </form>
              </div>
            )}

            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-500" /> Tentang Institusi
                  </h3>
                  <p className="text-slate-700 leading-relaxed font-medium">{instData.deskripsi || 'Tidak ada deskripsi.'}</p>
                  
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Alamat Lengkap</h3>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{instData.alamat || '-'}</p>
                        <p className="text-slate-500 text-sm">
                          {[instData.kecamatan, instData.kota_kabupaten, instData.provinsi].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl h-fit">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">Media Sosial</h3>
                  <div className="space-y-4">
                    {instData.social_media?.length > 0 ? instData.social_media.map((sm, i) => (
                      <a key={i} href={sm.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10 group">
                        <span className="text-blue-400 group-hover:scale-110 transition-transform">
                          {getPlatformIcon(sm.platform, 18)}
                        </span>
                        <span className="text-xs font-bold tracking-tight">{sm.username || sm.platform}</span>
                      </a>
                    )) : <p className="text-white/40 text-[10px] italic">Belum ada data.</p>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="tracer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm"
          >
            <form onSubmit={handleSaveTracer} className="space-y-10">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Tracer Study</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Konfigurasi Periode & Pesan Sambutan</p>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white rounded-full font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SIMPAN KONFIGURASI
                  </button>
               </div>

               <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tracerData.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tracerData.is_active ? <ShieldCheck size={28}/> : <Clock size={28}/>}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Status Kuesioner</p>
                      <p className="text-xs text-slate-500 font-medium">{tracerData.is_active ? 'Kuesioner aktif dan dapat diakses alumni.' : 'Kuesioner ditutup sementara.'}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={tracerData.is_active} onChange={e=>setTracerData({...tracerData,is_active:e.target.checked})}/>
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periode Mulai</label>
                    <input type="datetime-local" value={tracerData.start_date} onChange={e=>setTracerData({...tracerData,start_date:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periode Berakhir</label>
                    <input type="datetime-local" value={tracerData.end_date} onChange={e=>setTracerData({...tracerData,end_date:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"/>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kuesioner (Landing Page)</label>
                    <input value={tracerData.title} onChange={e=>setTracerData({...tracerData,title:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"/>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesan Sambutan Alumni</label>
                    <textarea value={tracerData.welcome_message} onChange={e=>setTracerData({...tracerData,welcome_message:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium h-32 resize-none transition-all"/>
                  </div>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

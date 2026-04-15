import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, Building, Mail, Phone, MapPin, 
  Loader2, CheckCircle2, FileText, Calendar, 
  Settings, Globe, ShieldCheck, Clock
} from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('institusi');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
    kota: '',
    kecamatan: '',
    kelurahan: '',
    rw: '',
    rt: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

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
        setInstData({
          nama: instRec.nama || '',
          email: instRec.email || '',
          no_hp: instRec.no_hp || '',
          deskripsi: instRec.deskripsi || '',
          alamat: instRec.alamat || '',
          negara: 'Indonesia',
          provinsi: instRec.provinsi || '',
          kota: instRec.kota || '',
          kecamatan: instRec.kecamatan || '',
          kelurahan: instRec.kelurahan || '',
          rw: instRec.rw || '',
          rt: instRec.rt || ''
        });
        if (instRec.logo) setLogoPreview(pb.files.getUrl(instRec, instRec.logo));
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
    setSuccess(false);
    setError('');

    try {
      const data = new FormData();
      Object.keys(instData).forEach(key => {
        if (key !== 'negara') data.append(key, instData[key]);
      });
      if (logoFile) data.append('logo', logoFile);

      if (instId) {
        await pb.collection('institution_profile').update(instId, data);
      } else {
        const record = await pb.collection('institution_profile').create(data);
        setInstId(record.id);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Gagal simpan profil: " + (err.message || "Pastikan koleksi 'institution_profile' sudah benar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTracer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
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
      setError("Gagal simpan tracer: " + (err.message || "Pastikan koleksi 'tracer_settings' sudah ada di PocketBase."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3 text-brand-primary" />
        Memuat seluruh konfigurasi sistem...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pusat Pengaturan</h1>
          <p className="text-slate-500 mt-1">Konfigurasi identitas institusi dan sistem kuesioner.</p>
        </div>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl font-black border border-emerald-100 shadow-sm"
          >
            <CheckCircle2 size={18} />
            DIANUT & DISIMPAN
          </motion.div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        {/* TAB HEADERS */}
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('institusi')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'institusi' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Building size={18} /> Profil Institusi
          </button>
          <button 
            onClick={() => setActiveTab('tracer')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'tracer' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FileText size={18} /> Konfigurasi Tracer Study
          </button>
        </div>

        <div className="p-8 md:p-12">
          {error && (
            <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic">
              ⚠ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'institusi' ? (
              <motion.form 
                key="institusi"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSaveInstitusi} 
                className="space-y-12"
              >
                {/* Logo Section */}
                <section className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-1/3 flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="w-48 h-48 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-300 shadow-inner">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building size={48} className="text-slate-200" />
                        )}
                      </div>
                      <label className="absolute -bottom-3 -right-3 p-3 bg-brand-primary text-white rounded-2xl shadow-xl hover:brightness-110 transition-all cursor-pointer">
                        <Upload size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                           const file = e.target.files[0];
                           if(file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                        }} />
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Resmi</label>
                      <input 
                        required 
                        value={instData.nama} 
                        onChange={(e) => setInstData({...instData, nama: e.target.value})} 
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-light outline-none font-bold text-slate-800"
                        placeholder="Universitas..." 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Singkat</label>
                      <textarea 
                        value={instData.deskripsi} 
                        onChange={(e) => setInstData({...instData, deskripsi: e.target.value})} 
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-light outline-none h-32 resize-none" 
                        placeholder="Tentang universitas..."
                      />
                    </div>
                  </div>
                </section>

                {/* Contact & Address (Grouped) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Mail size={12}/> Email Resmi</label>
                    <input type="email" value={instData.email} onChange={(e) => setInstData({...instData, email: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none" placeholder="info@..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Phone size={12}/> No. Telepon</label>
                    <input value={instData.no_hp} onChange={(e) => setInstData({...instData, no_hp: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none" placeholder="021..." />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Detail Jalan / Komplek</label>
                    <textarea value={instData.alamat} onChange={(e) => setInstData({...instData, alamat: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 h-24 resize-none outline-none" />
                  </div>
                  <RegionSelect formData={instData} handleChange={(e) => setInstData({...instData, [e.target.name]: e.target.value})} isIndonesia={true} />
                </div>

                <div className="flex justify-end pr-2">
                  <button type="submit" disabled={isSubmitting} className="px-10 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:bg-slate-300">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    SIMPAN PROFIL INSTITUSI
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="tracer"
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSaveTracer}
                className="space-y-12"
              >
                {/* Switch & Status */}
                <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${tracerData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {tracerData.is_active ? <ShieldCheck size={32} /> : <Clock size={32} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Status Tracer Study</h3>
                      <p className="text-sm text-slate-500">{tracerData.is_active ? 'Saat ini sedang TERBUKA untuk alumni.' : 'Saat ini sedang DITUTUP (Tampilan Pemeliharaan).'}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-125">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={tracerData.is_active}
                      onChange={(e) => setTracerData({...tracerData, is_active: e.target.checked})}
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Calendar size={12}/> Tanggal Mulai</label>
                    <input 
                      type="datetime-local" 
                      value={tracerData.start_date}
                      onChange={(e) => setTracerData({...tracerData, start_date: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Clock size={12}/> Tanggal Berakhir</label>
                    <input 
                      type="datetime-local" 
                      value={tracerData.end_date}
                      onChange={(e) => setTracerData({...tracerData, end_date: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Globe size={12}/> Target Tahun Lulus (Opsional)</label>
                  <input 
                    type="text" 
                    value={tracerData.target_years}
                    onChange={(e) => setTracerData({...tracerData, target_years: e.target.value})}
                    placeholder="Contoh: 2020-2024"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50" 
                  />
                  <p className="text-[10px] text-slate-400 font-bold px-2 uppercase tracking-widest mt-2">{`// Teks ini akan tampil sebagai panduan di sisi alumni.`}</p>
                </div>

                <div className="space-y-8 pt-4">
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Judul Kuesioner</label>
                    <input 
                      value={tracerData.title}
                      onChange={(e) => setTracerData({...tracerData, title: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 font-black text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pesan Sambutan (Welcome Message)</label>
                    <textarea 
                      value={tracerData.welcome_message}
                      onChange={(e) => setTracerData({...tracerData, welcome_message: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 h-32 resize-none outline-none focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pr-2">
                  <button type="submit" disabled={isSubmitting} className="px-10 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:bg-slate-300">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    SIMPAN PENGATURAN KUESIONER
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

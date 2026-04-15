import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, Mail, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';

export default function InstitutionProfile() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState(null);
  
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
    rt: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await pb.collection('institution_profile').getFirstListItem('');
      
      if (data) {
        setProfileId(data.id);
        setFormData({
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
          rt: data.rt || ''
        });
        
        if (data.logo) {
          setLogoPreview(pb.files.getUrl(data, data.logo));
        }
      }
    } catch (err) {
      console.error("Gagal mengambil profil institusi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'negara') {
          data.append(key, formData[key]);
        }
      });
      
      if (logoFile) {
        data.append('logo', logoFile);
      }

      if (profileId) {
        await pb.collection('institution_profile').update(profileId, data);
      } else {
        const record = await pb.collection('institution_profile').create(data);
        setProfileId(record.id);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3" />
        Memuat profil institusi...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profil Institusi</h1>
          <p className="text-slate-500 mt-1">Kelola identitas resmi universitas/sekolah di sistem.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold border border-emerald-100 animate-in zoom-in duration-300">
            <CheckCircle2 size={18} />
            Data Berhasil Diperbarui
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

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
                <label className="absolute -bottom-3 -right-3 p-3 bg-brand-primary text-white rounded-2xl shadow-xl shadow-blue-100/30 hover:brightness-110 transition-all cursor-pointer hover:scale-105 active:scale-95">
                  <Upload size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo Institusi</p>
                <p className="text-[10px] text-slate-400 mt-1 normal-case px-6">Gunakan file PNG atau SVG transparan minimal 512x512 pixel.</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Institusi / Universitas</label>
                <input 
                  required 
                  name="nama" 
                  value={formData.nama} 
                  onChange={handleChange} 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all outline-none font-bold text-lg text-slate-800"
                  placeholder="Contoh: Universitas Gadjah Mada" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Deskripsi Singkat</label>
                <textarea 
                  name="deskripsi" 
                  value={formData.deskripsi} 
                  onChange={handleChange} 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all outline-none resize-none h-32" 
                  placeholder="Tuliskan deskripsi singkat mengenai instansi..."
                ></textarea>
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Mail size={12}/> Email Resmi</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all" 
                placeholder="info@univ.ac.id" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Phone size={12}/> No. Telepon / Fax</label>
              <input 
                name="no_hp" 
                value={formData.no_hp} 
                onChange={handleChange} 
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all" 
                placeholder="(021) xxxxxxxx" 
              />
            </div>
          </section>

          {/* Address Section */}
          <section className="pt-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-light text-brand-primary rounded-lg">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Lokasi Kampus / Gedung</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Detail Jalan / Nomor / Komplek</label>
                <textarea 
                  name="alamat" 
                  value={formData.alamat} 
                  onChange={handleChange} 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none resize-none h-24" 
                  placeholder="Jl. Kaliurang KM 14.5, Sleman..."
                ></textarea>
              </div>
              
              <RegionSelect 
                formData={formData} 
                handleChange={handleChange} 
                isIndonesia={true} 
              />

              <div className="grid grid-cols-2 gap-6 w-full md:w-1/2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-slate-400">RW</label>
                  <input name="rw" value={formData.rw} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400" placeholder="001"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-slate-400">RT</label>
                  <input name="rt" value={formData.rt} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400" placeholder="012"/>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-10 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-100/30 hover:brightness-110 transition-all flex items-center gap-3 active:scale-95 disabled:bg-slate-300 disabled:shadow-none uppercase tracking-widest text-sm"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Simpan Profil Institusi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

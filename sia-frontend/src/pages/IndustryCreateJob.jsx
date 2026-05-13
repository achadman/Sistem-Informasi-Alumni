import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, MapPin, DollarSign, Calendar, GraduationCap,
  Save, Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  FileText, Target, ChevronDown, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import AutocompleteSearch from '../components/AutocompleteSearch';
import RegionSelect from '../components/RegionSelect';
import CustomSelect from '../components/CustomSelect';
import GlobalAddressSearch from '../components/GlobalAddressSearch';

const tipeOptions = ['Full-time', 'Part-time', 'Kontrak', 'Remote', 'Magang'];
const statusOptions = ['Draft', 'Aktif', 'Tutup'];
const prodiOptions = [
  'Teknik Informatika', 'Sistem Informasi', 'Manajemen', 'Akuntansi',
  'Teknik Elektro', 'Teknik Mesin', 'Ekonomi', 'Hukum',
  'Ilmu Komunikasi', 'Desain Grafis', 'Farmasi', 'Teknik Sipil'
];

export default function IndustryCreateJob() {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing
  const { user } = useAuthStore();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    persyaratan: '',
    lokasi: '',
    alamat: '',
    provinsi: '',
    kota_kabupaten: '',
    kecamatan: '',
    kelurahan: '',
    rt: '',
    rw: '',
    tipe_kerja: 'Full-time',
    gaji_min: '',
    gaji_max: '',
    min_ipk: '',
    deadline: '',
    status: 'Draft',
    prodi_target: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const comp = await pb.collection('companies').getFirstListItem(`user="${user?.id}"`);
        setCompany(comp);

        // If editing, load existing job
        if (id) {
          const job = await pb.collection('job_postings').getOne(id);
          let prodiArr = [];
          try { prodiArr = JSON.parse(job.prodi_target || '[]'); } catch {}
          setForm({
            judul: job.judul || '',
            deskripsi: job.deskripsi || '',
            persyaratan: job.persyaratan || '',
            lokasi: job.lokasi || '',
            alamat: job.alamat || '',
            provinsi: job.provinsi || '',
            kota_kabupaten: job.kota_kabupaten || job.kota || '',
            kecamatan: job.kecamatan || '',
            kelurahan: job.kelurahan || '',
            rt: job.rt || '',
            rw: job.rw || '',
            tipe_kerja: job.tipe_kerja || 'Full-time',
            gaji_min: job.gaji_min || '',
            gaji_max: job.gaji_max || '',
            min_ipk: job.min_ipk || '',
            deadline: job.deadline ? job.deadline.split(' ')[0] : '',
            status: job.status || 'Draft',
            prodi_target: prodiArr,
          });
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) init();
  }, [user, id]);

  const formatThreeDigits = (name, value) => {
    if (!value) return;
    if (/^\d+$/.test(value)) {
      const padded = value.padStart(3, '0');
      setForm(f => ({ ...f, [name]: padded }));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleProdi = (prodi) => {
    setForm(f => ({
      ...f,
      prodi_target: f.prodi_target.includes(prodi)
        ? f.prodi_target.filter(p => p !== prodi)
        : [...f.prodi_target, prodi]
    }));
  };

  const handleSave = async (e, forcedStatus = null) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      const finalStatus = forcedStatus || form.status;
      const payload = {
        company: company.id,
        judul: form.judul,
        deskripsi: form.deskripsi,
        persyaratan: form.persyaratan,
        lokasi: (form.kota_kabupaten && form.provinsi) ? `${form.kota_kabupaten}, ${form.provinsi}` : form.lokasi,
        alamat: form.alamat,
        provinsi: form.provinsi,
        kota: form.kota_kabupaten,
        kota_kabupaten: form.kota_kabupaten,
        kecamatan: form.kecamatan,
        kelurahan: form.kelurahan,
        rt: form.rt,
        rw: form.rw,
        tipe_kerja: form.tipe_kerja,
        gaji_min: form.gaji_min ? Number(form.gaji_min) : 0,
        gaji_max: form.gaji_max ? Number(form.gaji_max) : 0,
        min_ipk: form.min_ipk ? Number(form.min_ipk) : 0,
        deadline: form.deadline || null,
        status: finalStatus,
        prodi_target: JSON.stringify(form.prodi_target),
      };

      if (id) {
        await pb.collection('job_postings').update(id, payload);
        showToast('Lowongan berhasil diperbarui!');
      } else {
        await pb.collection('job_postings').create(payload);
        showToast(finalStatus === 'Aktif' ? 'Lowongan berhasil dipublikasikan!' : 'Draft lowongan berhasil disimpan!');
      }

      setTimeout(() => navigate('/industri/lowongan'), 1200);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSelect = (item) => {
    if (!item) {
      setForm(f => ({
        ...f,
        provinsi: '',
        kota_kabupaten: '',
        kecamatan: '',
        kelurahan: '',
        lokasi: '',
      }));
      return;
    }
    setForm(f => ({
      ...f,
      provinsi: item.province,
      kota_kabupaten: item.regency,
      kecamatan: item.district,
      kelurahan: item.name,
      lokasi: `${item.regency}, ${item.province}`,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat formulir...</p>
        </div>
      </div>
    );
  }

  // Protection: If company is not verified, show restriction message
  if (company && !company.verified) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="bg-surface border border-brand-primary/10 rounded-[2.5rem] p-10 text-center shadow-xl shadow-blue-500/5 relative overflow-hidden">
          {/* Decorative background icon */}
          <div className="absolute -right-8 -top-8 text-brand-primary/10 opacity-5 rotate-12">
            <Shield size={200} />
          </div>
          
          <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative z-10 transition-transform hover:scale-110">
            <Shield size={40} className="text-brand-primary" />
          </div>
          
          <h2 className="text-2xl font-black text-primary tracking-tight mb-4 relative z-10">
            Akun Menunggu Verifikasi
          </h2>
          
          <p className="text-secondary leading-relaxed mb-10 relative z-10 font-medium opacity-80">
            Maaf, fitur pembuatan lowongan kerja hanya tersedia untuk perusahaan yang telah 
            <span className="text-brand-primary font-bold"> diverifikasi oleh Admin</span>. 
            Silakan tunggu hingga tim kami meninjau profil perusahaan Anda.
          </p>
          
          <div className="flex flex-col gap-3 relative z-10">
            <button
              onClick={() => navigate('/industri')}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Kembali ke Dashboard
            </button>
            <button
              onClick={() => navigate('/industri/profil')}
              className="w-full py-4 bg-main border border-border-subtle text-secondary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-surface transition-all active:scale-95"
            >
              Lengkapi Profil Perusahaan
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-center gap-2 text-[10px] font-black text-secondary opacity-30 uppercase tracking-widest relative z-10">
            <Shield size={12} /> Status: Pending Review
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm border ${
            toast.type === 'error'
              ? 'bg-red-500/10 text-red-500 border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          } backdrop-blur-md`}
        >
          <div className={`p-1.5 rounded-lg ${toast.type === 'error' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          </div>
          {toast.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/industri/lowongan')}
          className="p-3 bg-surface border border-border-subtle rounded-xl hover:bg-main text-secondary hover:text-primary transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            {id ? 'Edit Lowongan' : 'Buat Lowongan Baru'}
          </h1>
          <p className="text-secondary text-sm mt-0.5 font-medium opacity-70">
            {id ? 'Perbarui informasi lowongan kerja aktif' : 'Isi detail lowongan untuk merekrut alumni terbaik'}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8"
        >
          <h3 className="font-black text-primary mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Briefcase size={18} />
            </div>
            Informasi Utama
          </h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Judul Lowongan Pekerjaan *</label>
              <input
                required
                type="text"
                value={form.judul}
                onChange={(e) => setForm(f => ({ ...f, judul: e.target.value }))}
                className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm"
                placeholder="Contoh: Senior Full Stack Developer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Tipe Hubungan Kerja *</label>
                <CustomSelect
                  value={form.tipe_kerja}
                  onChange={(e) => setForm(f => ({ ...f, tipe_kerja: e.target.value }))}
                  options={tipeOptions.map(t => ({ value: t, label: t }))}
                  placeholder="Pilih Tipe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Status Publikasi</label>
                <CustomSelect
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  options={statusOptions.map(s => ({ value: s, label: s }))}
                  placeholder="Pilih Status"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/50">
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <MapPin size={12} className="text-brand-primary" />
                Detail Lokasi Kerja
              </h4>

              <div className="space-y-6">
                {/* Alamat Jalan */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Alamat Lengkap (Jalan / No. Kantor) *</label>
                  <textarea
                    value={form.alamat}
                    onChange={(e) => setForm(f => ({ ...f, alamat: e.target.value }))}
                    rows={2}
                    className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm resize-none"
                    placeholder="Contoh: Jl. Sudirman No. 45, Gedung Jaya Lt. 5"
                  />
                </div>

                {/* Smart Address Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Cari Alamat (Kelurahan, Kecamatan, atau Kota) *</label>
                  <GlobalAddressSearch 
                    onSelect={handleAddressSelect}
                    valueDisplay={form.kelurahan ? `${form.kelurahan}, ${form.kecamatan}, ${form.kota_kabupaten}` : ''}
                    placeholder="Ketik alamat (misal: Sukapura)..."
                  />
                  {form.kelurahan && (
                    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-left-2">
                      <span className="text-[9px] font-black bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10 uppercase tracking-wider">{form.provinsi}</span>
                      <span className="text-[9px] font-black bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10 uppercase tracking-wider">{form.kota_kabupaten}</span>
                      <span className="text-[9px] font-black bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10 uppercase tracking-wider">{form.kecamatan}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">RT</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={form.rt}
                      onChange={(e) => setForm(f => ({ ...f, rt: e.target.value }))}
                      onBlur={(e) => formatThreeDigits('rt', e.target.value)}
                      className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                      placeholder="000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">RW</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={form.rw}
                      onChange={(e) => setForm(f => ({ ...f, rw: e.target.value }))}
                      onBlur={(e) => formatThreeDigits('rw', e.target.value)}
                      className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                      placeholder="000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description & Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="premium-card p-8"
        >
          <h3 className="font-black text-primary mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <FileText size={18} />
            </div>
            Detail Pekerjaan
          </h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Deskripsi Pekerjaan *</label>
              <textarea
                required
                value={form.deskripsi}
                onChange={(e) => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                rows={6}
                className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-medium text-sm resize-none leading-relaxed"
                placeholder="Gambarkan tanggung jawab, budaya kerja, dan benefit..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Persyaratan & Kualifikasi</label>
              <textarea
                value={form.persyaratan}
                onChange={(e) => setForm(f => ({ ...f, persyaratan: e.target.value }))}
                rows={5}
                className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-medium text-sm resize-none leading-relaxed"
                placeholder="- Lulusan Minimal S1&#10;- Pengalaman 1-2 tahun...&#10;- Menguasai Bahasa Inggris"
              />
            </div>
          </div>
        </motion.div>

        {/* Salary & Deadline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-8"
        >
          <h3 className="font-black text-primary mb-6 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <DollarSign size={18} />
            </div>
            Kompensasi & Waktu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Gaji Min (Rp)</label>
              <input
                type="number"
                value={form.gaji_min}
                onChange={(e) => setForm(f => ({ ...f, gaji_min: e.target.value }))}
                className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Gaji Max (Rp)</label>
              <input
                type="number"
                value={form.gaji_max}
                onChange={(e) => setForm(f => ({ ...f, gaji_max: e.target.value }))}
                className="w-full px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Batas Akhir Lamaran</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-30" />
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full pl-12 pr-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Target Candidates */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="premium-card p-8"
        >
          <h3 className="font-black text-primary mb-6 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Target size={18} />
            </div>
            Segmentasi Alumni
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Minimal Standar IPK</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4.0"
                value={form.min_ipk}
                onChange={(e) => setForm(f => ({ ...f, min_ipk: e.target.value }))}
                className="w-full max-w-[200px] px-5 py-4 bg-main border border-border-subtle rounded-2xl text-primary focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-bold text-sm"
                placeholder="3.0"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Program Studi Relevan</label>
              <p className="text-secondary text-[10px] font-bold opacity-50 ml-1">Pilih prodi yang paling diutamakan (Bisa lebih dari satu)</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {prodiOptions.map(prodi => (
                  <button
                    key={prodi}
                    type="button"
                    onClick={() => toggleProdi(prodi)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest ${
                      form.prodi_target.includes(prodi)
                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-blue-500/20 scale-105'
                        : 'bg-surface text-secondary opacity-60 border-border-subtle hover:bg-main hover:opacity-100'
                    }`}
                  >
                    {prodi}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => navigate('/industri/lowongan')}
            className="w-full sm:w-auto px-10 py-4 bg-surface text-secondary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:text-primary transition-all border border-border-subtle"
          >
            Batalkan
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {!id && (
              <button
                type="button"
                onClick={(e) => handleSave(e, 'Draft')}
                className="w-full sm:w-auto px-8 py-4 bg-surface border border-border-subtle text-secondary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:text-primary transition-all"
              >
                Simpan Draft
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSave(e, 'Aktif')}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-60 disabled:scale-100"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Sedang Memproses...</>
              ) : (
                <><Save size={18} /> {id ? 'Simpan Perubahan' : 'Publikasikan Lowongan'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

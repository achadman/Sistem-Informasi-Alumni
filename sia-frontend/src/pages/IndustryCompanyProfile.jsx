import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Mail, Phone, Globe, MapPin, Camera,
  Save, Loader2, CheckCircle2, AlertCircle, Edit3
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import AutocompleteSearch from '../components/AutocompleteSearch';

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
        });
        if (record.logo) {
          setLogoPreview(pb.files.getUrl(record, record.logo));
        }
      } catch (err) {
        console.error('Failed to fetch company:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchCompany();
  }, [user]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

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
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      if (logoFile) formData.append('logo', logoFile);

      const updated = await pb.collection('companies').update(company.id, formData);
      setCompany(updated);
      setLogoFile(null);
      showToast('Profil perusahaan berhasil disimpan!');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Gagal menyimpan. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat profil perusahaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm border ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profil Perusahaan</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Kelola informasi dan identitas perusahaan Anda</p>
        </div>
        {/* Verification Badge */}
        {company?.verified ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
            <CheckCircle2 size={15} /> Terverifikasi
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
            ⏳ Menunggu Verifikasi
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft"
        >
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
            <Camera size={18} className="text-blue-500" /> Logo Perusahaan
          </h3>
          <div className="flex items-center gap-6">
            <div
              onClick={() => document.getElementById('logo-input-edit').click()}
              className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden flex-shrink-0 relative group"
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <Edit3 size={20} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Building2 size={28} className="text-slate-300 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-bold">Upload Logo</p>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">{company?.nama || 'Nama Perusahaan'}</p>
              <p className="text-slate-400 text-xs mt-1">PNG, JPG, max 5MB</p>
              <button
                type="button"
                onClick={() => document.getElementById('logo-input-edit').click()}
                className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
              >
                Ganti Logo
              </button>
            </div>
            <input id="logo-input-edit" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft"
        >
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
            <Building2 size={18} className="text-blue-500" /> Informasi Dasar
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Perusahaan *</label>
                <input
                  required
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm"
                  placeholder="PT Contoh Indonesia"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sektor Industri *</label>
                <select
                  required
                  value={form.industri}
                  onChange={(e) => setForm(f => ({ ...f, industri: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm"
                >
                  <option value="">Pilih Sektor</option>
                  {sektorOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Deskripsi Perusahaan</label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm resize-none"
                placeholder="Deskripsikan perusahaan Anda, visi misi, dan budaya kerja..."
              />
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft"
        >
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
            <Mail size={18} className="text-blue-500" /> Kontak
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Perusahaan</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm"
                  placeholder="hr@company.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">No. Telepon</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  value={form.no_hp}
                  onChange={(e) => setForm(f => ({ ...f, no_hp: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm"
                  placeholder="(021) 1234-5678"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Website</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm"
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft"
        >
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
            <MapPin size={18} className="text-blue-500" /> Lokasi
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Alamat</label>
              <textarea
                value={form.alamat}
                onChange={(e) => setForm(f => ({ ...f, alamat: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all font-medium text-sm resize-none"
                placeholder="Jl. Contoh No. 123, Gedung ABC"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutocompleteSearch
                label="Provinsi"
                collection="provinces"
                placeholder="Cari atau pilih provinsi..."
                valueDisplay={form.provinsi}
                onSelect={(item) => setForm(f => ({ ...f, provinsi: item?.name || '' }))}
              />
              <AutocompleteSearch
                label="Kota / Kabupaten"
                collection="regencies"
                placeholder="Cari atau pilih kota..."
                valueDisplay={form.kota}
                onSelect={(item) => setForm(f => ({ ...f, kota: item?.name || '' }))}
              />
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-60 disabled:scale-100"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={18} /> Simpan Perubahan</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

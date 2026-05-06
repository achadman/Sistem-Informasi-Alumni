import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Mail, Lock, User, ArrowRight, Loader2, 
  GraduationCap, Eye, EyeOff, CheckCircle2, AlertCircle,
  MapPin, Globe, Phone, Briefcase, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import RegionSelect from '../components/RegionSelect';
import CustomSelect from '../components/CustomSelect';
import loginBg from '../assets/login-bg.png';

export default function IndustryRegister() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1 = account, 2 = company info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const [companyData, setCompanyData] = useState({
    nama: '',
    industri: '',
    deskripsi: '',
    email: '',
    no_hp: '',
    website: '',
    alamat: '',
    kota_kabupaten: '',
    provinsi: '',
    kecamatan: '',
    kelurahan: '',
    rt: '',
    rw: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const sektorOptions = [
    'Teknologi Informasi', 'Manufaktur', 'Keuangan & Perbankan', 'Kesehatan',
    'Pendidikan', 'Konstruksi', 'Perdagangan', 'Transportasi & Logistik',
    'Media & Komunikasi', 'Pertanian', 'Energi', 'Pariwisata & Hospitality',
    'Pemerintahan', 'Lainnya'
  ];

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const formatThreeDigits = (name, value) => {
    if (!value) return;
    if (/^\d+$/.test(value)) {
      const padded = value.padStart(3, '0');
      setCompanyData(prev => ({ ...prev, [name]: padded }));
    }
  };

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    return regex.test(pass);
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(accountData.password)) {
      setError('Password harus minimal 10 karakter dan kombinasi huruf kapital, kecil, angka, serta simbol.');
      return;
    }
    if (accountData.password !== accountData.passwordConfirm) {
      setError('Konfirmasi password tidak sesuai.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register(
        accountData.email,
        accountData.password,
        accountData.name,
        'industri'
      );

      if (!result.success) {
        const data = result.error?.response?.data;
        let errMsg = 'Gagal membuat akun.';
        if (data) {
          errMsg = Object.entries(data).map(([k, v]) => `${k}: ${v.message || JSON.stringify(v)}`).join(' | ');
        } else {
          errMsg = result.error?.message || errMsg;
        }
        setError(errMsg);
        setLoading(false);
        return;
      }

      const companyPayload = {
        nama: companyData.nama,
        industri: companyData.industri,
        user: result.userId,
        verified: false,
      };

      if (companyData.deskripsi) companyPayload.deskripsi = companyData.deskripsi;
      if (companyData.email || accountData.email) companyPayload.email = companyData.email || accountData.email;
      if (companyData.no_hp) companyPayload.no_hp = companyData.no_hp;
      if (companyData.website) companyPayload.website = companyData.website;
      if (companyData.alamat) companyPayload.alamat = companyData.alamat;
      if (companyData.kota_kabupaten) companyPayload.kota_kabupaten = companyData.kota_kabupaten;
      if (companyData.provinsi) companyPayload.provinsi = companyData.provinsi;
      if (companyData.kecamatan) companyPayload.kecamatan = companyData.kecamatan;
      if (companyData.kelurahan) companyPayload.kelurahan = companyData.kelurahan;
      if (companyData.rt) companyPayload.rt = companyData.rt;
      if (companyData.rw) companyPayload.rw = companyData.rw;

      if (logoFile) {
        const formData = new FormData();
        Object.entries(companyPayload).forEach(([key, value]) => formData.append(key, value));
        formData.append('logo', logoFile);
        await pb.collection('companies').create(formData);
      } else {
        await pb.collection('companies').create(companyPayload);
      }

      navigate('/industri');
    } catch (err) {
      console.error("Register error:", err);
      let msg = 'Terjadi kesalahan saat pendaftaran.';
      if (err.response?.data) {
        const data = err.response.data;
        // Map PocketBase validation errors to readable strings
        msg = Object.entries(data).map(([k, v]) => {
          const detail = v.message || JSON.stringify(v);
          return `${k}: ${detail}`;
        }).join(' | ');
      } else {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const [showWelcome, setShowWelcome] = useState(true);

  const WelcomeModal = () => (
    <AnimatePresence>
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-blue-600 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-400/20 blur-3xl" />
            
            <div className="p-10 lg:p-14 text-white relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                  <Building2 size={32} />
                </div>
                <button onClick={() => setShowWelcome(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <h2 className="text-4xl font-black leading-tight mb-6">Partner dengan Talenta Terbaik.</h2>
              <p className="text-blue-100 text-lg font-medium leading-relaxed mb-10">
                Temukan alumni unggulan yang siap berkontribusi bagi pertumbuhan perusahaan Anda. Bergabunglah dengan ratusan mitra industri kami untuk akses eksklusif.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                {[
                  'Akses database alumni terverifikasi',
                  'Pasang lowongan kerja gratis',
                  'Analitik pelamar yang mendalam',
                  'Networking eksklusif institusi'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
                    <CheckCircle2 size={20} className="text-blue-300 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowWelcome(false)}
                className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
              >
                Mulai Pendaftaran Mitra
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-8 font-outfit overflow-x-hidden">
      <WelcomeModal />
      
      {/* Background with Image and Blur */}
      <div className="fixed inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-5xl bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
      >
        <div className="grid lg:grid-cols-1">

        {/* Form Content */}
        <div className="p-8 lg:p-12 lg:px-20 max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Mitra Baru</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Langkah {step} dari 2 • Informasi Akun & Entitas</p>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setShowWelcome(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">Lihat Panduan</button>
               <Link to="/login" className="text-xs font-black text-slate-400 uppercase tracking-wider hover:text-blue-600 transition-colors">Masuk</Link>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex gap-2 mb-10">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </motion.div>
            )}

            {step === 1 ? (
              <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleStep1} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama PIC / HRD</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input required type="text" value={accountData.name} onChange={(e) => setAccountData({...accountData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="Nama Lengkap Penanggung Jawab" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Profesional</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input required type="email" value={accountData.email} onChange={(e) => setAccountData({...accountData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="hr@perusahaan.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input required type={showPassword ? 'text' : 'password'} value={accountData.password} onChange={(e) => setAccountData({...accountData, password: e.target.value})} className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input required type={showPassword ? 'text' : 'password'} value={accountData.passwordConfirm} onChange={(e) => setAccountData({...accountData, passwordConfirm: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 mt-4">
                  Lanjutkan Profil <ChevronRight size={16} />
                </button>
              </motion.form>
            ) : (
              <motion.form key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-8">
                {/* Logo & Basic Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                  <div onClick={() => document.getElementById('logo-reg').click()} className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all overflow-hidden shrink-0 shadow-sm">
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <Building2 size={32} className="text-slate-300" />}
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-sm font-black text-slate-800">Logo Perusahaan</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Opsional. Mendukung format JPG/PNG dengan resolusi tinggi.</p>
                    <button type="button" onClick={() => document.getElementById('logo-reg').click()} className="text-[11px] font-black text-blue-600 uppercase tracking-wider mt-2 hover:text-blue-700">Pilih File</button>
                  </div>
                  <input id="logo-reg" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Entitas *</label>
                    <input required type="text" value={companyData.nama} onChange={(e) => setCompanyData({...companyData, nama: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="PT. Nama Perusahaan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sektor *</label>
                    <CustomSelect value={companyData.industri} onChange={(e) => setCompanyData({...companyData, industri: e.target.value})} options={sektorOptions} placeholder="Pilih Sektor" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Kantor Pusat *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-4 text-slate-300" />
                    <textarea required rows={2} value={companyData.alamat} onChange={(e) => setCompanyData({...companyData, alamat: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all resize-none" placeholder="Alamat lengkap, nama jalan, nomor..." />
                  </div>
                </div>

                <RegionSelect formData={companyData} handleChange={(e) => setCompanyData({...companyData, [e.target.name]: e.target.value})} isIndonesia={true} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Telp Perusahaan</label>
                    <div className="relative group">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input type="text" value={companyData.no_hp} onChange={(e) => setCompanyData({...companyData, no_hp: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="(021) xxxxx" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Resmi</label>
                    <div className="relative group">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input type="url" value={companyData.website} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all" placeholder="https://company.com" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <ChevronLeft size={16} /> Sebelumnya
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {loading ? 'Memproses...' : 'Daftarkan Sekarang'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

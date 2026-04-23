import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Mail, Lock, User, ArrowRight, Loader2, 
  GraduationCap, Eye, EyeOff, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { motion } from 'framer-motion';
import RegionSelect from '../components/RegionSelect';
import CustomSelect from '../components/CustomSelect';
import { Home, MapPin } from 'lucide-react';

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
    // Only pad if it is a number and less than 3 digits
    if (/^\d+$/.test(value)) {
      const padded = value.padStart(3, '0');
      setCompanyData(prev => ({ ...prev, [name]: padded }));
    }
  };

  const validatePassword = (pass) => {
    // Min 10 characters, at least one uppercase, one lowercase, one number and one symbol
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Create user account with role 'industri'
      const result = await register(
        accountData.email,
        accountData.password,
        accountData.name,
        'industri'
      );

      if (!result.success) {
        const errMsg = result.error?.response?.data || result.error?.message || 'Gagal membuat akun. Pastikan email belum terdaftar.';
        if (typeof errMsg === 'object') {
          const messages = Object.values(errMsg).map(v => v?.message || JSON.stringify(v)).join(', ');
          setError(messages);
        } else {
          setError(errMsg);
        }
        setLoading(false);
        return;
      }

      // Step 2: Create company profile linked to the user
      // Use JSON instead of FormData for non-file fields to avoid type conversion issues
      const companyPayload = {
        nama: companyData.nama,
        industri: companyData.industri,
        user: result.userId,
        verified: false,
      };

      // Only add optional fields if they have a value (PocketBase validates email/url format)
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

      // If logo file exists, use FormData; otherwise use JSON
      let createdCompany;
      if (logoFile) {
        const formData = new FormData();
        Object.entries(companyPayload).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('logo', logoFile);
        createdCompany = await pb.collection('companies').create(formData);
      } else {
        createdCompany = await pb.collection('companies').create(companyPayload);
      }

      console.log('Company created successfully:', createdCompany);

      // Navigate to industry dashboard
      navigate('/industri');
    } catch (err) {
      console.error('Registration error full:', err);
      console.error('Error response data:', err?.response?.data);
      const detail = err?.response?.data 
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v?.message || JSON.stringify(v)}`).join('; ')
        : '';
      setError(detail || err?.message || 'Terjadi kesalahan saat mendaftarkan perusahaan. Periksa console untuk detail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Building2 size={28} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Registrasi Industri
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Daftarkan perusahaan Anda untuk mengakses database alumni berkualitas
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            step === 1 
              ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {step > 1 ? <CheckCircle2 size={16} /> : <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>}
            Akun
          </div>
          <div className="w-8 h-px bg-slate-200"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            step === 2 
              ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
              : 'bg-white text-slate-400 border border-slate-200'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
            Perusahaan
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-8 mt-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleStep1} 
              className="p-8 space-y-5"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-2">Informasi Akun</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Penanggung Jawab</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={accountData.name}
                    onChange={(e) => setAccountData({...accountData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="Nama lengkap HR / PIC"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="hr@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={accountData.password}
                    onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="Min. 10 karakter (A-a, 0-9, Simbol)"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={accountData.passwordConfirm}
                    onChange={(e) => setAccountData({...accountData, passwordConfirm: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                    placeholder="Ulangi password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase tracking-wider mt-6"
              >
                Lanjut ke Profil Perusahaan <ArrowRight size={18} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit} 
              className="p-8 space-y-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">Profil Perusahaan</h2>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  ← Kembali
                </button>
              </div>
              
              {/* Logo Upload */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div 
                  onClick={() => document.getElementById('logo-input').click()}
                  className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden flex-shrink-0"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={28} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Logo Perusahaan</p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG max 5MB (opsional)</p>
                </div>
                <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Perusahaan *</label>
                <input
                  required
                  type="text"
                  value={companyData.nama}
                  onChange={(e) => setCompanyData({...companyData, nama: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                  placeholder="PT Contoh Indonesia"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sektor Industri *</label>
                <CustomSelect
                  name="industri"
                  value={companyData.industri}
                  onChange={(e) => setCompanyData({...companyData, industri: e.target.value})}
                  options={sektorOptions}
                  placeholder="Pilih Sektor Industri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                <textarea
                  value={companyData.deskripsi}
                  onChange={(e) => setCompanyData({...companyData, deskripsi: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium resize-none"
                  placeholder="Deskripsi singkat perusahaan..."
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-blue-600" /> Lokasi Perusahaan
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Alamat Lengkap / Jalan *</label>
                  <textarea
                    required
                    name="alamat"
                    value={companyData.alamat}
                    onChange={(e) => setCompanyData({...companyData, alamat: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium resize-none text-sm"
                    placeholder="Nama jalan, nomor gedung, blok, dsb..."
                  />
                  <p className="text-[10px] text-slate-400 italic ml-1">* Ketikkan alamat detail agar mudah ditemukan di peta</p>
                </div>

                <RegionSelect 
                  formData={companyData} 
                  handleChange={(e) => setCompanyData({...companyData, [e.target.name]: e.target.value})}
                  isIndonesia={true}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">RT</label>
                    <input
                      type="text"
                      name="rt"
                      value={companyData.rt}
                      onChange={(e) => setCompanyData({...companyData, rt: e.target.value})}
                      onBlur={(e) => formatThreeDigits('rt', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                      placeholder="001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">RW</label>
                    <input
                      type="text"
                      name="rw"
                      value={companyData.rw}
                      onChange={(e) => setCompanyData({...companyData, rw: e.target.value})}
                      onBlur={(e) => formatThreeDigits('rw', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                      placeholder="001"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">No. Telepon</label>
                <input
                  type="text"
                  value={companyData.no_hp}
                  onChange={(e) => setCompanyData({...companyData, no_hp: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                  placeholder="(021) xxx-xxxx"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Website (opsional)</label>
                <input
                  type="url"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium"
                  placeholder="https://company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase tracking-wider mt-6 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={18} /> Mendaftarkan...</>
                ) : (
                  <><Building2 size={18} /> Daftarkan Perusahaan</>
                )}
              </button>
            </motion.form>
          )}
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-slate-500 text-sm">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Masuk di sini
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
            <GraduationCap size={14} />
            <span>Sistem Informasi Alumni Portal</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

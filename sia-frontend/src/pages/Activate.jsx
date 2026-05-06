import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, UserCheck, Mail, Lock, Loader2, 
  ArrowRight, ShieldCheck, AlertCircle, ChevronLeft 
} from 'lucide-react';
import loginBg from '../assets/login-bg.png';

export default function Activate() {
  const [step, setStep] = useState(1);
  const [nim, setNim] = useState('');
  const [masterRecord, setMasterRecord] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyNIM = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const records = await pb.collection('master_nim').getList(1, 1, {
        filter: `nim = "${nim}"`,
      });

      if (records.items.length === 0) {
        throw new Error("NIM tidak ditemukan dalam database master. Pastikan NIM yang Anda masukkan benar.");
      }

      const record = records.items[0];
      if (record.is_active) {
        throw new Error("Akun dengan NIM ini sudah diaktivasi. Silakan login ke portal alumni.");
      }

      setMasterRecord(record);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi NIM.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError("Sandi harus minimal 10 karakter dengan kombinasi huruf kapital, kecil, angka, dan simbol.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError("Konfirmasi sandi tidak sesuai.");
      setLoading(false);
      return;
    }

    try {
      const userData = {
        username: nim,
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        name: masterRecord.name || nim,
        role: "alumni",
      };

      const newUser = await pb.collection('users').create(userData);

      await pb.collection('master_nim').update(masterRecord.id, {
        is_active: true,
        user_id: newUser.id
      });

      await useAuthStore.getState().login(nim, password);
      navigate('/');
      
    } catch (err) {
      setError(err.message || 'Gagal membuat akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 font-outfit">
      {/* Background with Image and Blur */}
      <div className="fixed inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden">
          
          <div className="p-10 text-center bg-slate-50/50 border-b border-slate-100">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <UserCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aktivasi Alumni</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {step === 1 ? 'Validasi identitas menggunakan NIM' : 'Lengkapi kredensial akun Anda'}
            </p>
          </div>

          <div className="p-10">
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="s1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyNIM} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Induk Mahasiswa (NIM)</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                        <GraduationCap size={18} />
                      </div>
                      <input 
                        type="text" 
                        required
                        className="w-full pl-14 pr-6 py-4.5 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl focus:outline-none transition-all text-sm font-black uppercase tracking-wider"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        placeholder="Contoh: 12345678"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !nim}
                    className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {loading ? 'Memverifikasi...' : 'Verifikasi NIM'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="s2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister} 
                  className="space-y-5"
                >
                  <div className="p-4 bg-blue-50 rounded-2xl mb-2 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <UserCheck size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Terverifikasi</p>
                      <p className="text-sm font-black text-slate-700 mt-1">{masterRecord?.name || nim}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Aktif</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sandi Baru</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                          type="password" 
                          required
                          className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                          type="password" 
                          required
                          className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <ChevronLeft size={16} /> Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/20 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      {loading ? 'Memproses...' : 'Selesaikan'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/50 font-medium">
          Sudah terdaftar? <Link to="/login" className="text-white font-black hover:underline ml-1">Masuk ke Akun</Link>
        </p>
      </motion.div>
    </div>
  );
}

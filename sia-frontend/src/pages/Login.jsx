import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Building2, Shield, Loader2, ArrowRight, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import loginBg from '../assets/login-bg.png';

export default function Login() {
  const [activeTab, setActiveTab] = useState('alumni');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const res = await login(identifier, password);
    if (res.success) {
      const userRole = res.data.record.role;
      const expectedRole = activeTab === 'perusahaan' ? 'industri' : activeTab;

      // Allow admin to login via any tab, otherwise check role match
      if (userRole !== expectedRole && userRole !== 'admin') {
        logout();
        const roleNames = {
          alumni: 'Alumni',
          industri: 'Mitra Industri',
          admin: 'Administrator'
        };
        const currentPortalName = activeTab === 'perusahaan' ? 'Industri' : 'Alumni';
        const errorMsg = `Akun Anda terdaftar sebagai ${roleNames[userRole] || userRole}. Anda tidak dapat masuk melalui Portal ${currentPortalName}.`;
        setError(errorMsg);
        toast.error(errorMsg, {
          description: "Silakan gunakan tab login yang sesuai.",
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      toast.success(`Selamat datang kembali, ${res.data.record.name}!`, {
        description: "Mengarahkan ke dashboard...",
      });
      navigate('/');
    } else {
      const status = res.error?.status;
      const message = res.error?.message;
      let errorMsg = message || 'Terjadi kesalahan sistem.';

      if (status === 400 || message?.toLowerCase().includes('authenticate')) {
        const portalName = activeTab === 'perusahaan' ? 'Industri' : 'Alumni';
        errorMsg = `Kredensial salah atau akun tidak terdaftar di Portal ${portalName}.`;
      }

      setError(errorMsg);
      toast.error(errorMsg, {
        description: "Periksa kembali Email/NIM dan Password Anda.",
        duration: 4000,
      });
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIdentifier('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  return (
    <div className="h-screen flex bg-slate-900 font-sans overflow-hidden">
      {/* Left Side: Hero Section */}
      <div className="hidden lg:flex lg:w-[68%] relative p-12 flex-col justify-between overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={loginBg} 
            alt="Campus" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/80 to-blue-900/20" />
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-2xl">
            <GraduationCap size={32} className="text-white" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full mb-6">
            <Shield size={12} className="text-blue-400" />
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-[0.2em]">Heritage & Excellence</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight mb-6">
              Membangun Masa <br /> Depan Melalui <br />
              <span className="text-blue-400">Jejaring Alumni.</span>
            </h1>
            <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md opacity-80">
              Sistem Informasi Akademik dan Tracer Study hadir untuk mempererat hubungan antara institusi dan lulusan, serta memfasilitasi pengembangan karir yang berkelanjutan.
            </p>
          </motion.div>
        </div>

        {/* Bottom Section: Stats */}
        <div className="relative z-10 flex gap-12">
          <div className="space-y-1">
            <p className="text-3xl font-black text-white tracking-tight">15k+</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Alumni Aktif</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-white tracking-tight">500+</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Mitra Perusahaan</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Panel */}
      <div className="w-full lg:w-[32%] bg-white lg:rounded-l-[4rem] relative flex flex-col px-6 md:px-10 py-6 overflow-hidden shadow-[-20px_0_60px_rgba(0,0,0,0.1)]">
        <div className="flex-1 max-w-[310px] w-full mx-auto flex flex-col justify-center">
          {/* Branding (Top) */}
          <div className="flex items-center gap-2.5 mb-8 -ml-0.5">
            <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary tracking-tight uppercase">Alumni Portal</h2>
              <p className="text-[7px] font-bold text-secondary uppercase tracking-[0.2em] opacity-40">SIA & Tracer Study</p>
            </div>
          </div>
          {/* Welcome Text */}
          <div className="mb-5">
            <h3 className="text-lg font-black text-primary tracking-tight mb-0.5">Selamat Datang Kembali</h3>
            <p className="text-[11px] font-medium text-secondary opacity-70">
              Silakan masuk menggunakan akun SIA Anda.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg mb-5 border border-slate-200/30">
            {[
              { id: 'alumni', label: 'Alumni', icon: GraduationCap },
              { id: 'perusahaan', label: 'Perusahaan', icon: Building2 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black transition-all relative z-10 ${
                  activeTab === tab.id ? 'text-white shadow-md' : 'text-secondary hover:text-primary'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-primary rounded-md -z-10"
                  />
                )}
                <tab.icon size={13} />
                <span className="uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-black flex items-center gap-3 uppercase tracking-wide"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] opacity-50">
                  {activeTab === 'alumni' ? 'NIM / NPM' : 'Email Bisnis'}
                </label>
                {activeTab === 'alumni' && (
                  <Link to="/support-request" className="text-[8px] font-black text-brand-primary hover:underline uppercase tracking-widest">Lupa?</Link>
                )}
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary opacity-30 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all">
                  {activeTab === 'alumni' ? <User size={13} /> : <Mail size={13} />}
                </div>
                <input 
                  type={activeTab === 'perusahaan' ? 'email' : 'text'} 
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-[11px] font-bold text-primary placeholder:text-secondary/20"
                  placeholder={activeTab === 'alumni' ? 'NIM / NPM Anda' : 'nama@perusahaan.com'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] opacity-50">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary opacity-30 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all">
                  <Lock size={13} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-[12px] font-bold text-primary placeholder:text-secondary/20"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="w-3 h-3 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
              <label htmlFor="remember" className="text-[9px] font-bold text-secondary opacity-60">Ingat saya</label>
            </div>

            <button 
              type="submit" 
              disabled={loading || !identifier || !password}
              className="w-full py-3 bg-brand-primary hover:bg-brand-dark text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <><span className="ml-2 text-[10px]">Masuk ke Akun</span> <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Bottom Actions */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-medium text-secondary opacity-60">Belum memiliki akun?</span>
              <Link to="/activate" className="text-[10px] font-black text-amber-600 hover:text-amber-700 ml-2 uppercase tracking-widest inline-flex items-center gap-1 group">
                Aktivasi NIM <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Help Center Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-xl flex items-start gap-3 group hover:bg-white hover:border-brand-primary/20 transition-all">
              <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all">
                <AlertCircle size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-primary uppercase tracking-wider mb-0.5">Pusat Bantuan</p>
                <p className="text-[8px] font-medium text-secondary leading-relaxed">
                  Kendala saat masuk? Hubungi <span className="text-brand-primary font-bold">it-support@univ.ac.id</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 text-center">
          <p className="text-[7px] font-bold text-secondary opacity-25 uppercase tracking-[0.3em]">
            &copy; 2025 UNIVERSITY ALUMNI MANAGEMENT PORTAL.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Building2, Shield, Loader2, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
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
      // Role checking logic
      const userRole = res.data.record.role;
      const expectedRole = activeTab === 'perusahaan' ? 'industri' : activeTab;

      if (userRole !== expectedRole) {
        logout();
        const roleNames = {
          alumni: 'Alumni',
          industri: 'Mitra Industri',
          admin: 'Administrator'
        };
        const currentPortalName = activeTab === 'perusahaan' ? 'Industri' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
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
      // Enhanced error messaging for failed authentication
      const status = res.error?.status;
      const message = res.error?.message;
      let errorMsg = message || 'Terjadi kesalahan sistem.';

      if (status === 400 || message?.toLowerCase().includes('authenticate')) {
        const portalName = activeTab === 'perusahaan' ? 'Industri' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
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

  const getThemeColor = () => {
    if (activeTab === 'alumni') return 'blue';
    if (activeTab === 'perusahaan') return 'indigo';
    return 'emerald';
  };

  const theme = getThemeColor();

  return (
    <div className="min-h-screen flex bg-white font-outfit">
      {/* Left Side: Branding & Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img 
          src={loginBg} 
          alt="University Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        {/* Content on Image */}
        <div className="relative z-10 w-full h-full p-16 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight uppercase">SIA Alumni</span>
          </div>

          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight mb-6">
                Gerbang Menuju <span className="text-blue-400">Masa Depan</span> Gemilang.
              </h2>
              <p className="text-slate-300 text-lg font-medium leading-relaxed">
                Platform terpadu untuk alumni, institusi, dan industri guna membangun ekosistem profesional yang saling menguatkan.
              </p>
            </motion.div>
            
            <div className="flex gap-10 mt-12">
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">5K+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alumni Aktif</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">100+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mitra Industri</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-xs font-bold tracking-widest uppercase">
            <span>Privacy Policy</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span>Terms of Service</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span>&copy; 2026 Universitas Antigravity</span>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50/50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[440px]"
        >
          {/* Logo mobile only */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <GraduationCap size={28} className="text-white" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang Kembali</h1>
            <p className="text-slate-500 font-medium">Silakan masuk ke akun portal <span className="text-slate-900 font-bold capitalize">{activeTab}</span> Anda.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm border border-slate-200 rounded-[1.25rem] mb-10">
            {[
              { id: 'alumni', label: 'Alumni', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-600' },
              { id: 'perusahaan', label: 'Industri', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-600' },
              { id: 'admin', label: 'Admin', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-black transition-all relative z-10 ${
                  activeTab === tab.id 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className={`absolute inset-0 ${tab.bg} rounded-2xl -z-10 shadow-lg shadow-black/5`}
                  />
                )}
                <tab.icon size={16} />
                <span className="hidden sm:inline tracking-wide uppercase">{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin} 
              className="space-y-6"
            >
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  {activeTab === 'alumni' ? 'NIM / Akun' : activeTab === 'perusahaan' ? 'Email Bisnis' : 'Admin ID'}
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    {activeTab === 'alumni' ? <User size={18} /> : <Mail size={18} />}
                  </div>
                  <input 
                    type={activeTab === 'perusahaan' ? 'email' : 'text'} 
                    required
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold shadow-sm"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'alumni' ? 'Nomor Induk Mahasiswa' : 
                      activeTab === 'perusahaan' ? 'hr@perusahaan.com' : 
                      'Admin ID / Email'
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" title="Coming soon" className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">Lupa sandi?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full pl-14 pr-14 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || !identifier || !password}
                className={`w-full py-4.5 text-white rounded-2xl font-black shadow-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 tracking-widest uppercase text-xs ${
                  theme === 'blue' ? 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-500' :
                  theme === 'indigo' ? 'bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-500' :
                  'bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </motion.form>
          </AnimatePresence>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            {activeTab === 'alumni' && (
              <p className="text-sm text-slate-500 font-medium">
                Belum aktivasi akun? <Link to="/activate" className="text-blue-600 hover:text-blue-700 font-black ml-1 transition-all">Aktivasi NIM Sekarang</Link>
              </p>
            )}
            {activeTab === 'perusahaan' && (
              <p className="text-sm text-slate-500 font-medium">
                Ingin mencari talenta? <Link to="/industri/register" className="text-indigo-600 hover:text-indigo-700 font-black ml-1 transition-all">Daftar Mitra Industri</Link>
              </p>
            )}
            {activeTab === 'admin' && (
             <p className="text-xs text-slate-400 font-bold tracking-tight">
               Sistem Informasi Alumni &bull; v2.4.0
             </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Building2, Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [activeTab, setActiveTab] = useState('alumni');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // login function supports both username and email automatically thanks to PB identityFields
    const res = await login(identifier, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error?.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          <div className="p-8 text-center bg-slate-50/50 border-b border-slate-100">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sistem Alumni</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Masuk ke portal {activeTab}</p>
          </div>

          <div className="p-8">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button
                onClick={() => handleTabChange('alumni')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'alumni' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <GraduationCap size={16} /> Alumni
              </button>
              <button
                onClick={() => handleTabChange('perusahaan')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'perusahaan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Building2 size={16} /> Industri
              </button>
              <button
                onClick={() => handleTabChange('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Shield size={16} /> Admin
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form 
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin} 
                className="space-y-5"
              >
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {activeTab === 'alumni' ? 'NIM (Nomor Induk Mahasiswa)' : activeTab === 'perusahaan' ? 'Email Perusahaan' : 'Username / Email'}
                  </label>
                  <input 
                    type={activeTab === 'perusahaan' ? 'email' : 'text'} 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'alumni' 
                        ? 'Contoh: 12345678' 
                        : activeTab === 'perusahaan' 
                          ? 'hr@perusahaan.com' 
                          : 'admin@alumni.ac.id'
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || !identifier || !password}
                  className={`w-full py-4 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 ${
                    activeTab === 'alumni' ? 'bg-brand-primary shadow-blue-500/20 hover:bg-blue-600' :
                    activeTab === 'perusahaan' ? 'bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700' :
                    'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Masuk...' : 'Log In'}
                </button>
              </motion.form>
            </AnimatePresence>
            
            {/* Contextual Links based on Tab */}
            <div className="mt-8 text-center">
              {activeTab === 'alumni' && (
                <p className="text-sm text-slate-500 font-medium">
                  Belum punya akses? <Link to="/activate" className="text-brand-primary hover:text-blue-700 font-bold border-b-2 border-transparent hover:border-blue-700 pb-0.5 transition-all">Aktivasi NIM</Link>
                </p>
              )}
              {activeTab === 'perusahaan' && (
                <p className="text-sm text-slate-500 font-medium">
                  Ingin pasang lowongan? <Link to="/industri/register" className="text-indigo-600 hover:text-indigo-700 font-bold border-b-2 border-transparent hover:border-indigo-700 pb-0.5 transition-all">Daftar Mitra Industri</Link>
                </p>
              )}
              {activeTab === 'admin' && (
               <p className="text-xs text-slate-400 font-medium">
                 Akses eksklusif administrator sistem.
               </p>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Dikelola oleh Career Center Universitas Antigravity &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}

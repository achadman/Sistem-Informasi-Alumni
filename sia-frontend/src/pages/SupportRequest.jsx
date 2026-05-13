import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Mail, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SupportRequest() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Lupa NIM / Masalah Login',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
    toast.success('Permintaan Anda telah dikirim ke Admin.');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Laporan Terkirim!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium">
            Terima kasih telah melapor. Admin kami akan segera meninjau permintaan Anda dan menghubungi melalui email yang Anda berikan.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Kembali ke Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-[480px] w-full">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>

        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-slate-200 border border-white relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-12 -top-12 text-slate-50 opacity-10 rotate-12">
            <ShieldCheck size={240} />
          </div>

          <div className="relative z-10">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Pusat Bantuan</h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Lupa NIM atau memiliki kendala lain? Isi formulir di bawah untuk melapor ke Admin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-300"
                    placeholder="Masukkan nama sesuai ijazah"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Aktif</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-300"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Masalah</label>
                <div className="relative group">
                  <MessageSquare size={18} className="absolute left-4 top-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <textarea 
                    required
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-300 resize-none"
                    placeholder="Jelaskan masalah Anda (misal: Lupa NIM, Tahun Lulus 2020...)"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Laporan'}
                {!loading && <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

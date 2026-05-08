import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, CheckCircle2, XCircle, Clock, Eye, Loader2,
  Globe, Mail, Phone, MapPin, Shield, AlertCircle, Users, ExternalLink
} from 'lucide-react';
import { pb } from '../lib/pb';
import { formatDate } from '../lib/utils';

export default function AdminCompanyVerification() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // pending, all
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await pb.collection('companies').getFullList({ 
        requestKey: null 
      });
      setCompanies(result);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err.message || 'Gagal memuat data perusahaan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerify = async (companyId, verify) => {
    setProcessingId(companyId);
    try {
      await pb.collection('companies').update(companyId, { verified: verify });
      setCompanies(prev =>
        prev.map(c => c.id === companyId ? { ...c, verified: verify } : c)
      );
      showToast(verify ? 'Perusahaan diverifikasi! Email notifikasi terkirim.' : 'Verifikasi dibatalkan');
    } catch (err) {
      showToast('Gagal memperbarui status.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = companies.filter(c => !c.verified).length;
  const verifiedCount = companies.filter(c => c.verified).length;
  const displayed = tab === 'pending' ? companies.filter(c => !c.verified) : companies;

  return (
    <div className="min-h-screen bg-[#f1f5f9] -m-8 p-6 lg:p-10 lg:px-[2.5%] font-outfit">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm border backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-red-500 text-white border-red-400'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header & Mini Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-end gap-6 mb-2">
          
          <div className="flex gap-3">
            {[
              { label: 'Total', value: companies.length, color: 'blue' },
              { label: 'Pending', value: pendingCount, color: 'amber', highlight: pendingCount > 0 },
              { label: 'Terverifikasi', value: verifiedCount, color: 'emerald' },
            ].map((s) => (
              <div key={s.label} className={`px-5 py-3 rounded-2xl border bg-white shadow-sm flex flex-col items-center min-w-[100px] ${s.highlight ? 'ring-2 ring-amber-500/20 border-amber-200' : 'border-slate-100'}`}>
                <span className="text-xl font-black text-slate-900 leading-none">{s.value}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${s.highlight ? 'text-amber-600' : 'text-slate-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs & Search Mockup */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full sm:w-auto">
            {[
              { key: 'pending', label: 'Menunggu', count: pendingCount },
              { key: 'all', label: 'Semua', count: companies.length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  tab === t.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
                <span className="ml-2 opacity-40">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-slate-400 font-medium">Sinkronisasi data...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Building2 size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Tidak Ada Data</h3>
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">
              {tab === 'pending' ? 'Semua perusahaan telah ditinjau.' : 'Belum ada perusahaan yang mendaftar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {displayed.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-6">
                  {/* Compact Logo */}
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {company.logo ? (
                      <img src={pb.files.getUrl(company, company.logo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={24} className="text-slate-200" />
                    )}
                  </div>

                  {/* High Density Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-black text-slate-900 truncate pr-4">{company.nama}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        company.verified 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {company.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">
                      {company.industri || 'Bidang Industri'}
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <Mail size={12} className="opacity-40" />
                        <span className="truncate">{company.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <MapPin size={12} className="opacity-40" />
                        <span className="truncate">{company.kota || company.provinsi || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Refined Action Toggle & View */}
                  <div className="shrink-0 pl-4 border-l border-slate-100 ml-2 flex flex-col gap-3">
                    <Link
                      to={`/admin/perusahaan/${company.id}`}
                      className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all flex items-center justify-center border border-slate-100 hover:border-blue-100"
                      title="Lihat Profil Lengkap"
                    >
                      <Eye size={16} />
                    </Link>

                    <button
                      onClick={() => handleVerify(company.id, !company.verified)}
                      disabled={processingId === company.id}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${
                        company.verified ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'
                      } ${processingId === company.id ? 'opacity-50' : 'active:scale-95'}`}
                    >
                      <motion.div 
                        animate={{ x: company.verified ? 24 : 0 }}
                        className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"
                      >
                        {processingId === company.id ? (
                          <Loader2 size={12} className="animate-spin text-slate-400" />
                        ) : company.verified ? (
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        ) : (
                          <Clock size={12} className="text-slate-400" />
                        )}
                      </motion.div>
                    </button>
                    <p className="text-[9px] font-black text-center mt-2 text-slate-400 uppercase tracking-widest">
                      {company.verified ? 'Active' : 'Verify'}
                    </p>
                  </div>
                </div>

                {/* Footer Link Overlay */}
                {company.website && (
                  <a 
                    href={company.website} target="_blank" rel="noreferrer"
                    className="absolute bottom-4 right-20 text-[10px] font-bold text-blue-400 hover:text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Site <ExternalLink size={10} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

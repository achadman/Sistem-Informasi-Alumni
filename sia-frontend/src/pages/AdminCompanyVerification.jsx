import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Building2, CheckCircle2, XCircle, Clock, Eye, Loader2,
  Globe, Mail, Phone, MapPin, Shield, AlertCircle, Users
} from 'lucide-react';
import { pb } from '../lib/pb';

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock size={13} /> },
  verified: { label: 'Terverifikasi', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={13} /> },
  rejected: { label: 'Ditolak', color: 'bg-red-50 text-red-600 border-red-100', icon: <XCircle size={13} /> },
};

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
      const result = await pb.collection('companies').getFullList({ requestKey: null });
      setCompanies(result);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      // Detailed error message for better diagnostics
      const errorMsg = err?.response?.data 
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v?.message || JSON.stringify(v)}`).join('; ')
        : (err.message || 'Gagal memuat data perusahaan');
      
      setError(`${errorMsg} (Status: ${err?.status || 'Unknown'})`);
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
      showToast(verify ? 'Perusahaan berhasil diverifikasi!' : 'Verifikasi dibatalkan');
    } catch (err) {
      console.error('Update status failed:', err);
      showToast('Gagal memperbarui status.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCompanies = companies.filter(c => !c.verified);
  const verifiedCompanies = companies.filter(c => c.verified);
  const displayed = tab === 'pending' ? pendingCompanies : companies;

  const tabs = [
    { key: 'pending', label: 'Pending Verifikasi', count: pendingCompanies.length },
    { key: 'all', label: 'Semua Perusahaan', count: companies.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data perusahaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verifikasi Perusahaan</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Kelola pendaftaran dan verifikasi akun industri</p>
        </div>
        {pendingCompanies.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
            <AlertCircle size={16} />
            <span className="font-black text-sm">{pendingCompanies.length} Menunggu</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Perusahaan', value: companies.length, icon: <Building2 size={18} />, color: 'blue' },
          { label: 'Terverifikasi', value: verifiedCompanies.length, icon: <CheckCircle2 size={18} />, color: 'emerald' },
          { label: 'Pending', value: pendingCompanies.length, icon: <Clock size={18} />, color: 'amber' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`p-5 bg-${stat.color}-50 rounded-2xl border border-${stat.color}-100`}
          >
            <div className={`text-${stat.color}-500 mb-2`}>{stat.icon}</div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className={`text-xs font-bold text-${stat.color}-600 mt-0.5`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-blue-500' : 'text-slate-300'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <p className="font-bold text-red-800">Gagal Mengambil Data</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchCompanies}
            className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Company List */}
      {displayed.length === 0 && !error ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-slate-300" />
          </div>
          <p className="font-black text-slate-700 text-lg">
            {tab === 'pending' ? 'Tidak ada perusahaan pending' : 'Belum ada perusahaan terdaftar'}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {tab === 'pending'
              ? 'Semua perusahaan sudah diverifikasi 🎉'
              : 'Perusahaan yang mendaftar akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:shadow-blue-50 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {company.logo ? (
                    <img src={pb.files.getUrl(company, company.logo)} alt={company.nama} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-slate-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                    <h3 className="font-black text-slate-900">{company.nama}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${
                      company.verified
                        ? STATUS_CONFIG.verified.color
                        : STATUS_CONFIG.pending.color
                    }`}>
                      {company.verified ? STATUS_CONFIG.verified.icon : STATUS_CONFIG.pending.icon}
                      {company.verified ? 'Terverifikasi' : 'Pending'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium mb-2">{company.industri}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                    {company.email && (
                      <span className="flex items-center gap-1"><Mail size={11} /> {company.email}</span>
                    )}
                    {company.no_hp && (
                      <span className="flex items-center gap-1"><Phone size={11} /> {company.no_hp}</span>
                    )}
                    {(company.kota_kabupaten || company.kota || company.provinsi) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {[
                          company.kecamatan, 
                          company.kota_kabupaten || company.kota, 
                          company.provinsi
                        ].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-600 transition-colors">
                        <Globe size={11} /> Website
                      </a>
                    )}
                  </div>

                  {company.deskripsi && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{company.deskripsi}</p>
                  )}

                  <p className="text-[10px] text-slate-300 mt-2 font-medium">
                    Mendaftar {new Date(company.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!company.verified ? (
                    <button
                      onClick={() => handleVerify(company.id, true)}
                      disabled={processingId === company.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm disabled:opacity-60"
                    >
                      {processingId === company.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      Verifikasi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(company.id, false)}
                      disabled={processingId === company.id}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl font-bold text-xs transition-all active:scale-95 border border-slate-100"
                    >
                      {processingId === company.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <XCircle size={13} />
                      )}
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
